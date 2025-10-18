<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class InspectionAcceptanceReportController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $request->all();

        $data['items'] = collect($request->input('items', []))
            ->filter(fn ($item) => filled($item['description'] ?? null))
            ->map(function ($item) {
                return [
                    'stock_no' => $item['stock_number'] ?? $item['stock_no'] ?? '',
                    'description' => $item['description'] ?? '',
                    'unit' => $item['unit'] ?? '',
                    'quantity' => $item['quantity'] ?? '',
                ];
            })
            ->values()
            ->all();

        // Normalize and map incoming keys to the camelCase keys the Blade expects
        $viewData = [
            'entityName' => $data['entity_name'] ?? $data['entityName'] ?? '',
            'fundCluster' => $data['fund_cluster'] ?? $data['fundCluster'] ?? '',
            'supplier' => $data['supplier'] ?? $data['supplierName'] ?? '',
            'iarNo' => $data['iar_no'] ?? $data['iarNo'] ?? '',
            'iarDate' => $data['iar_date'] ?? $data['iarDate'] ?? '',
            'poNo' => $data['po_no'] ?? $data['poNo'] ?? '',
            'poDate' => $data['po_date'] ?? $data['poDate'] ?? '',
            'requisitioningOffice' => $data['requisitioning_office'] ?? $data['requisitioningOffice'] ?? '',
            'responsibilityCenterCode' => $data['responsibility_center_code'] ?? $data['responsibilityCenterCode'] ?? '',
            'invoiceNo' => $data['invoice_no'] ?? $data['invoiceNo'] ?? '',
            'invoiceDate' => $data['invoice_date'] ?? $data['invoiceDate'] ?? '',
            'dateInspected' => $data['date_inspected'] ?? $data['dateInspected'] ?? '',
            'dateReceived' => $data['date_received'] ?? $data['dateReceived'] ?? '',
            'inspectionStatus' => $data['inspection_status'] ?? $data['inspectionStatus'] ?? '',
            'acceptanceStatus' => $data['acceptance_status'] ?? $data['acceptanceStatus'] ?? '',
            'items' => $data['items'] ?? [],
        ];

        $pdf = Pdf::loadView('pdf.inspection_acceptance_report_pdf', $viewData);
        try {
            \App\Models\Activity::create(['action' => 'Generated Inspection Acceptance Report PDF', 'meta' => json_encode(['info' => null])]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for IAR PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('inspection_acceptance_report.pdf');
    }

    /**
     * Stream a blank A4 preview of the inspection and acceptance report PDF.
     */
    public function preview()
    {
        // Preview with clean/empty placeholders (no sample data)
        $sample = [
            'entityName' => '',
            'fundCluster' => '',
            'supplier' => '',
            'iarNo' => '',
            'iarDate' => '',
            'poNo' => '',
            'poDate' => '',
            'requisitioningOffice' => '',
            'invoiceNo' => '',
            'responsibilityCenterCode' => '',
            'invoiceDate' => '',
            'dateInspected' => '',
            'dateReceived' => '',
            'inspectionStatus' => '',
            'acceptanceStatus' => '',
            'items' => [],
        ];

        $pdf = Pdf::loadView('pdf.inspection_acceptance_report_pdf', $sample)->setPaper('a4', 'portrait');

        return $pdf->stream('inspection_acceptance_report_preview.pdf');
    }
}
