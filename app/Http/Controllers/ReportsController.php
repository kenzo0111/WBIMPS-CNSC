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
        // Load the template
        $templatePath = storage_path('app/templates/rsmi_template.xlsx');
        if (!file_exists($templatePath)) {
            return response()->json(['error' => 'RSMI template not found. Please ensure rsmi_template.xlsx exists in storage/app/templates/'], 404);
        }

        $spreadsheet = IOFactory::load($templatePath);
        $sheet = $spreadsheet->getActiveSheet();

        // Get RSMI data - filter by date range and department if provided
        // Use Purchase Orders (match frontend logic)
        $query = \App\Models\PurchaseOrder::query();

        // Include purchase orders that would show in RSMI report (submitted, approved, etc.)
        // Match the frontend logic from renderRsmiReport
        $query->whereIn('status', ['submitted', 'approved', 'completed', 'issued', 'pending']);

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $rsmiRecords = $query->get();

        // Fill header information
        $sheet->setCellValue('A6', 'Entity Name: Camarines Norte State College');
        $sheet->setCellValue('E6', 'Serial No. : ' . date('Y-m-d-His'));

        $sheet->setCellValue('A7', 'Fund Cluster: 05 - Internally Generated Funds');
        $sheet->setCellValue('E7', 'Date : ' . date('M d, Y'));

        // Fill items data starting from row 11 (after column headers)
        $row = 11;

        foreach ($rsmiRecords as $po) {
            if ($po->items && is_array($po->items)) {
                foreach ($po->items as $item) {
                    if ($row > 30)
                        break; // Don't overflow into recapitulation section

                    $issueQty = $item['quantity'] ?? $item['issue_quantity'] ?? 0;
                    $unitCost = $item['unit_cost'] ?? $item['unitPrice'] ?? $item['price'] ?? 0;
                    $amount = $issueQty * $unitCost;

                    // Use PO ID as RIS No and department as Responsibility Center Code
                    $sheet->setCellValue('A' . $row, $po->id ?? '');
                    $sheet->setCellValue('B' . $row, $po->department ?? '');
                    $sheet->setCellValue('C' . $row, $item['stock_no'] ?? $item['stockNumber'] ?? '');
                    $sheet->setCellValue('D' . $row, $item['description'] ?? $item['name'] ?? '');
                    $sheet->setCellValue('E' . $row, $item['unit'] ?? $item['unitMeasure'] ?? '');
                    $sheet->setCellValue('F' . $row, $issueQty);
                    $sheet->setCellValue('G' . $row, $unitCost);
                    $sheet->setCellValue('H' . $row, $amount);

                    $row++;
                }
            }
        }

        // Fill recapitulation section (starting at row 33)
        $recapRow = 33;
        $stockSummary = [];

        // Group items by stock number for recapitulation
        foreach ($rsmiRecords as $ris) {
            if ($ris->items && is_array($ris->items)) {
                foreach ($ris->items as $item) {
                    $stockNo = $item['stock_no'] ?? 'N/A';
                    $issueQty = $item['issue_quantity'] ?? $item['quantity'] ?? 0;
                    $unitCost = $item['unit_cost'] ?? $item['price'] ?? 0;

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
            }
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
    }
}