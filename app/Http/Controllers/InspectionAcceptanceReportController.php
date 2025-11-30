<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class InspectionAcceptanceReportController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $request->all();

        $data['items'] = collect($request->input('items', []))
            ->filter(function ($item) {
                // consider several possible description keys from different dynamic forms
                return filled($item['description'] ?? $item['detailedDescription'] ?? $item['detailed_description'] ?? null);
            })
            ->map(function ($item) {
                // normalize a variety of possible incoming item keys (PO vs IAR dynamic forms)
                $stock = $item['stock_number'] ?? $item['stock_no'] ?? $item['stockPropertyNumber'] ?? $item['stock_property_number'] ?? $item['property_number'] ?? '';
                $description = $item['description'] ?? $item['detailedDescription'] ?? $item['detailed_description'] ?? '';
                $unit = $item['unit'] ?? $item['unitOfMeasure'] ?? $item['unit_of_measure'] ?? $item['uom'] ?? '';
                $quantity = $item['quantity'] ?? $item['qty'] ?? $item['requestedQuantity'] ?? $item['requested_quantity'] ?? '';

                return [
                    'stock_no' => $stock,
                    'description' => $description,
                    'unit' => $unit,
                    'quantity' => $quantity,
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
            // accept both snake_case and camelCase and also provide a short alias (requisitionOffice)
            'requisitioningOffice' => $data['requisitioning_office'] ?? $data['requisitioningOffice'] ?? $data['requisition_office'] ?? $data['requisitionOffice'] ?? '',
            'requisitionOffice' => $data['requisitioning_office'] ?? $data['requisitioningOffice'] ?? $data['requisition_office'] ?? $data['requisitionOffice'] ?? '',
            'responsibilityCenterCode' => $data['responsibility_center_code'] ?? $data['responsibilityCenterCode'] ?? '',
            'responsibilityDate' => $data['responsibility_date'] ?? $data['responsibilityDate'] ?? '',
            'invoiceNo' => $data['invoice_no'] ?? $data['invoiceNo'] ?? $data['invoice_number'] ?? $data['invoiceNumber'] ?? '',
            'invoiceDate' => $data['invoice_date'] ?? $data['invoiceDate'] ?? '',
            'dateInspected' => $data['date_inspected'] ?? $data['dateInspected'] ?? '',
            'dateReceived' => $data['date_received'] ?? $data['dateReceived'] ?? '',
            'inspectionStatus' => $data['inspection_status'] ?? $data['inspectionStatus'] ?? '',
            'inspectionOfficerLabel' => $data['inspection_officer_label'] ?? $data['inspectionOfficerLabel'] ?? '',
            'inspectionOfficerPosition' => $data['inspection_officer_position'] ?? $data['inspectionOfficerPosition'] ?? '',
            'acceptanceStatus' => $data['acceptance_status'] ?? $data['acceptanceStatus'] ?? '',
            'custodianLabel' => $data['custodian_label'] ?? $data['custodianLabel'] ?? '',
            'custodianPosition' => $data['custodian_position'] ?? $data['custodianPosition'] ?? '',
            'items' => $data['items'] ?? [],
        ];

        $pdf = Pdf::loadView('pdf.inspection_acceptance_report_pdf', $viewData);
        try {
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties(['info' => null])
                ->log('Generated Inspection Acceptance Report PDF');
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
            'requisitionOffice' => $iar->requisitioning_office ?? '',
            'responsibilityCenterCode' => $iar->responsibility_center_code ?? '',
            'responsibilityDate' => $iar->responsibility_date ? $iar->responsibility_date->format('Y-m-d') : '',
            'invoiceNo' => $iar->invoice_no ?? '',
            'invoiceDate' => $iar->invoice_date ? $iar->invoice_date->format('Y-m-d') : '',
            'dateInspected' => $iar->date_inspected ? $iar->date_inspected->format('Y-m-d') : '',
            'dateReceived' => $iar->date_received ? $iar->date_received->format('Y-m-d') : '',
            'inspectionStatus' => $iar->inspection_status ?? '',
            'inspectionOfficerLabel' => $iar->inspection_officer_label ?? '',
            'inspectionOfficerPosition' => $iar->inspection_officer_position ?? '',
            'acceptanceStatus' => $iar->acceptance_status ?? '',
            'custodianLabel' => $iar->custodian_label ?? '',
            'custodianPosition' => $iar->custodian_position ?? '',
            'items' => collect($iar->items ?? [])->map(function ($item) {
                return [
                    'stock_no' => $item['stock_no'] ?? $item['stock_number'] ?? $item['item_no'] ?? '',
                    'description' => $item['description'] ?? $item['detailedDescription'] ?? $item['detailed_description'] ?? '',
                    'unit' => $item['unit'] ?? $item['unitOfMeasure'] ?? $item['unit_of_measure'] ?? '',
                    'quantity' => $item['quantity'] ?? $item['qty'] ?? $item['requested_quantity'] ?? '',
                ];
            })->values()->all(),
        ];

        try {
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties(['iar_no' => $iar->iar_no, 'id' => $id])
                ->log('Downloaded Inspection Acceptance Report PDF');
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
                'requisitionOffice' => $iar->requisitioning_office ?? '',
                'responsibilityCenterCode' => $iar->responsibility_center_code ?? '',
                'responsibilityDate' => $iar->responsibility_date ? $iar->responsibility_date->format('Y-m-d') : '',
                'invoiceNo' => $iar->invoice_no ?? '',
                'invoiceDate' => $iar->invoice_date ? $iar->invoice_date->format('Y-m-d') : '',
                'dateInspected' => $iar->date_inspected ? $iar->date_inspected->format('Y-m-d') : '',
                'dateReceived' => $iar->date_received ? $iar->date_received->format('Y-m-d') : '',
                'inspectionStatus' => $iar->inspection_status ?? '',
                'inspectionOfficerLabel' => $iar->inspection_officer_label ?? '',
                'inspectionOfficerPosition' => $iar->inspection_officer_position ?? '',
                'acceptanceStatus' => $iar->acceptance_status ?? '',
                'custodianLabel' => $iar->custodian_label ?? '',
                'custodianPosition' => $iar->custodian_position ?? '',
                'items' => collect($iar->items ?? [])->map(function ($item) {
                    return [
                        'stock_no' => $item['stock_no'] ?? $item['stock_number'] ?? $item['item_no'] ?? '',
                        'description' => $item['description'] ?? $item['detailedDescription'] ?? $item['detailed_description'] ?? '',
                        'unit' => $item['unit'] ?? $item['unitOfMeasure'] ?? $item['unit_of_measure'] ?? '',
                        'quantity' => $item['quantity'] ?? $item['qty'] ?? $item['requested_quantity'] ?? '',
                    ];
                })->values()->all(),
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
            'requisitionOffice' => '',
            'responsibilityDate' => '',
            'invoiceNo' => '',
            'responsibilityCenterCode' => '',
            'invoiceDate' => '',
            'dateInspected' => '',
            'dateReceived' => '',
            'inspectionStatus' => '',
            'inspectionOfficerPosition' => '',
            'acceptanceStatus' => '',
            'custodianPosition' => '',
            'items' => [],
        ];

        $pdf = Pdf::loadView('pdf.inspection_acceptance_report_pdf', $sample)->setPaper('a4', 'portrait');

        return $pdf->stream('inspection_acceptance_report_preview.pdf');
    }
}
