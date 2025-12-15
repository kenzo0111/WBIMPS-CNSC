<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Models\Item;
use App\Models\RequisitionIssueSlip;

class ReportsController extends Controller
{
    public function exportRcpi(Request $request)
    {
        // Load the template
        $templatePath = storage_path('app/templates/rcpi_template.xlsx');
        if (!file_exists($templatePath)) {
            return response()->json(['error' => 'Template not found'], 404);
        }

        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // Get data - assuming items from database
        $items = Item::with('category')->get();

        // Assuming table starts at row 17 (after the header)
        $row = 17;

        foreach ($items as $item) {
            $qty = $item->quantity ?? $item->current_stock ?? 0;
            $unitCost = $item->unit_cost ?? $item->unit_price ?? 0;

            $sheet->setCellValue('A' . $row, $item->category ? $item->category->name : 'Supplies');
            $sheet->setCellValue('B' . $row, $item->name ?? '');
            $sheet->setCellValue('C' . $row, $item->id ?? $item->stock_number ?? '');
            $sheet->setCellValue('D' . $row, $item->unit ?? $item->unit_measure ?? '');
            $sheet->setCellValue('E' . $row, $unitCost);
            $sheet->setCellValue('F' . $row, $qty);
            $sheet->setCellValue('G' . $row, $qty); // On hand count
            $sheet->setCellValue('H' . $row, 0); // Shortage qty
            $sheet->setCellValue('I' . $row, 0); // Shortage value
            $sheet->setCellValue('J' . $row, ''); // Remarks

            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'rcpi-report-' . date('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function exportRsmi(Request $request)
    {
        try {
            // Load the template
            $templatePath = storage_path('app/templates/rsmi_template.xlsx');
            if (!file_exists($templatePath)) {
                return response()->json(['error' => 'RSMI template not found. Please ensure rsmi_template.xlsx exists in storage/app/templates/'], 404);
            }

            $spreadsheet = IOFactory::load($templatePath);
            $sheet = $spreadsheet->getActiveSheet();

        // Check if items data is provided in request
        if ($request->has('items')) {
            $itemsJson = $request->input('items');
            $itemsIssued = json_decode($itemsJson, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $itemsIssued = [];
            }
        } else {
            // Fallback to querying database
            $query = \App\Models\RequisitionIssueSlip::query();

            if ($request->filled('department')) {
                $query->where('responsibility_center_code', $request->department);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $rsmiRecords = $query->get();

            // Flatten items
            $itemsIssued = [];
            foreach ($rsmiRecords as $r) {
                if ($r->items && is_array($r->items)) {
                    foreach ($r->items as $item) {
                        $itemsIssued[] = [
                            'risNo' => $r->ris_no ?? $r->id ?? '',
                            'centerCode' => $r->responsibility_center_code ?? '',
                            'stockNo' => $item['stock_no'] ?? $item['stockNumber'] ?? '',
                            'description' => $item['item_description'] ?? $item['description'] ?? $item['name'] ?? '',
                            'unit' => $item['unit'] ?? $item['unitMeasure'] ?? '',
                            'qty' => $item['quantity'] ?? $item['qty'] ?? 0,
                            'unitCost' => $item['unit_cost'] ?? $item['unitCost'] ?? $item['unitPrice'] ?? 0,
                            'amount' => ($item['quantity'] ?? $item['qty'] ?? 0) * ($item['unit_cost'] ?? $item['unitCost'] ?? $item['unitPrice'] ?? 0),
                        ];
                    }
                }
            }
        }

        // Fill header information
        $sheet->setCellValue('A6', 'Entity Name: Camarines Norte State College');
        $sheet->setCellValue('E6', 'Serial No. : ' . date('Y-m-d-His'));

        $sheet->setCellValue('A7', 'Fund Cluster: 05 - Internally Generated Funds');
        $sheet->setCellValue('E7', 'Date : ' . date('M d, Y'));

        // Fill items data starting from row 11 (after column headers)
        $row = 11;

        foreach ($itemsIssued as $item) {
            if ($row > 30) break; // Don't overflow into recapitulation section

            $sheet->setCellValue('A' . $row, $item['risNo'] ?? $item['ris_no'] ?? '');
            $sheet->setCellValue('B' . $row, $item['centerCode'] ?? $item['responsibility_center_code'] ?? '');
            $sheet->setCellValue('C' . $row, $item['stockNo'] ?? $item['stock_no'] ?? '');
            $sheet->setCellValue('D' . $row, $item['description'] ?? $item['item_description'] ?? '');
            $sheet->setCellValue('E' . $row, $item['unit'] ?? '');
            $sheet->setCellValue('F' . $row, $item['qty'] ?? $item['quantity'] ?? 0);
            $sheet->setCellValue('G' . $row, $item['unitCost'] ?? $item['unit_cost'] ?? 0);
            $sheet->setCellValue('H' . $row, $item['amount'] ?? 0);

            $row++;
        }

        // Fill recapitulation section (starting at row 33)
        $recapRow = 33;
        $stockSummary = [];

        // Group items by stock number for recapitulation
        foreach ($itemsIssued as $item) {
            $stockNo = $item['stockNo'] ?? $item['stock_no'] ?? 'N/A';
            $issueQty = $item['qty'] ?? $item['quantity'] ?? 0;
            $unitCost = $item['unitCost'] ?? $item['unit_cost'] ?? 0;

            if (!isset($stockSummary[$stockNo])) {
                $stockSummary[$stockNo] = [
                    'quantity' => 0,
                    'unit_cost' => $unitCost,
                    'total_cost' => 0
                ];
            }

            $stockSummary[$stockNo]['quantity'] += $issueQty;
            $stockSummary[$stockNo]['total_cost'] += ($issueQty * $unitCost);
        }

        // Fill recapitulation data
        foreach ($stockSummary as $stockNo => $data) {
            if ($recapRow > 42)
                break; // Don't overflow into signature section

            $sheet->setCellValue('B' . $recapRow, $stockNo); // Stock No. under first recapitulation
            $sheet->setCellValue('C' . $recapRow, $data['quantity']); // Quantity under first recapitulation
            $sheet->setCellValue('F' . $recapRow, $data['unit_cost']); // Unit Cost under second recapitulation
            $sheet->setCellValue('G' . $recapRow, $data['total_cost']); // Total Cost under second recapitulation
            $sheet->setCellValue('H' . $recapRow, ''); // UACS Object Code under second recapitulation

            $recapRow++;
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'rsmi-report-' . date('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}