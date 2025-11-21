<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class InspectionAcceptanceReportController extends Controller
{
    public function generatePDF(Request $request)
    {
        $user = $request->user();
        if (!($user && ($user->is_admin === true || $user->isSupplyOfficer() || $user->isOfficeAssistant()))) {
            abort(403, 'Forbidden');
        }
        $data = $request->all();

        $data['items'] = collect($request->input('items', []))
            ->filter(fn($item) => filled($item['description'] ?? null))
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
     * Download PDF for a specific IAR record.
     * Similar to preview but forces download instead of streaming.
     */
    public function downloadPDF($id)
    {
        $user = request()->user();
        if (!($user && ($user->is_admin === true || $user->isSupplyOfficer() || $user->isOfficeAssistant()))) {
            abort(403, 'Forbidden');
        }
        // First, try to find IAR by its own ID
        $iar = \App\Models\InspectionAcceptanceReport::find($id);

        // If not found, try to find IAR by purchase_order_id
        if (!$iar) {
            $iar = \App\Models\InspectionAcceptanceReport::where('purchase_order_id', $id)->first();
        }

        if (!$iar) {
            abort(404, 'Inspection Acceptance Report not found');
        }

        // Prepare data from the model
        $viewData = [
            'entityName' => $iar->entity_name ?? '',
            'fundCluster' => $iar->fund_cluster ?? '',
            'supplier' => $iar->supplier ?? '',
            'iarNo' => $iar->iar_no ?? '',
            'iarDate' => $iar->iar_date ? $iar->iar_date->format('Y-m-d') : '',
            'poNo' => $iar->po_no ?? '',
            'poDate' => $iar->po_date ? $iar->po_date->format('Y-m-d') : '',
            'requisitioningOffice' => $iar->requisitioning_office ?? '',
            'responsibilityCenterCode' => $iar->responsibility_center_code ?? '',
            'invoiceNo' => $iar->invoice_no ?? '',
            'invoiceDate' => $iar->invoice_date ? $iar->invoice_date->format('Y-m-d') : '',
            'dateInspected' => $iar->date_inspected ? $iar->date_inspected->format('Y-m-d') : '',
            'dateReceived' => $iar->date_received ? $iar->date_received->format('Y-m-d') : '',
            'inspectionStatus' => $iar->inspection_status ?? '',
            'acceptanceStatus' => $iar->acceptance_status ?? '',
            'items' => $iar->items ?? [],
        ];

        try {
            \App\Models\Activity::create([
                'action' => 'Downloaded Inspection Acceptance Report PDF',
                'meta' => json_encode(['iar_no' => $iar->iar_no, 'id' => $id]),
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for IAR PDF download', ['error' => $e->getMessage()]);
        }

        $pdf = Pdf::loadView('pdf.inspection_acceptance_report_pdf', $viewData)
            ->setPaper('a4', 'portrait');

        return $pdf->download('inspection_acceptance_report_' . ($iar->iar_no ?? $id) . '.pdf');
    }

    /**
     * Stream a preview of the inspection and acceptance report PDF.
     * Accepts an optional ID to load from the database.
     * The ID can be either an IAR ID or a Purchase Order ID.
     */
    public function preview($id = null)
    {
        $user = request()->user();
        if (!($user && ($user->is_admin === true || $user->isSupplyOfficer() || $user->isOfficeAssistant()))) {
            abort(403, 'Forbidden');
        }
        // If an ID is provided, load the inspection acceptance report from the database
        if ($id) {
            // First, try to find IAR by its own ID
            $iar = \App\Models\InspectionAcceptanceReport::find($id);

            // If not found, try to find IAR by purchase_order_id
            if (!$iar) {
                $iar = \App\Models\InspectionAcceptanceReport::where('purchase_order_id', $id)->first();
            }

            if (!$iar) {
                abort(404, 'Inspection Acceptance Report not found');
            }

            // Prepare data from the model
            $viewData = [
                'entityName' => $iar->entity_name ?? '',
                'fundCluster' => $iar->fund_cluster ?? '',
                'supplier' => $iar->supplier ?? '',
                'iarNo' => $iar->iar_no ?? '',
                'iarDate' => $iar->iar_date ? $iar->iar_date->format('Y-m-d') : '',
                'poNo' => $iar->po_no ?? '',
                'poDate' => $iar->po_date ? $iar->po_date->format('Y-m-d') : '',
                'requisitioningOffice' => $iar->requisitioning_office ?? '',
                'responsibilityCenterCode' => $iar->responsibility_center_code ?? '',
                'invoiceNo' => $iar->invoice_no ?? '',
                'invoiceDate' => $iar->invoice_date ? $iar->invoice_date->format('Y-m-d') : '',
                'dateInspected' => $iar->date_inspected ? $iar->date_inspected->format('Y-m-d') : '',
                'dateReceived' => $iar->date_received ? $iar->date_received->format('Y-m-d') : '',
                'inspectionStatus' => $iar->inspection_status ?? '',
                'acceptanceStatus' => $iar->acceptance_status ?? '',
                'items' => $iar->items ?? [],
            ];

            $pdf = Pdf::loadView('pdf.inspection_acceptance_report_pdf', $viewData)->setPaper('a4', 'portrait');

            return $pdf->stream('inspection_acceptance_report_' . ($iar->iar_no ?? $id) . '.pdf');
        }

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
