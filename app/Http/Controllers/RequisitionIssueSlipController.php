<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class RequisitionIssueSlipController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $this->prepareData($request);

        $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', $data);

        try {
            \App\Models\Activity::create(['action' => 'Generated Requisition Issue Slip PDF', 'meta' => json_encode(['ris_no' => $data['ris_no'] ?? null])]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for RIS PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('requisition_issue_slip.pdf');
    }

    public function preview(Request $request = null, $id = null)
    {
        // If an ID is provided, load the requisition issue slip from the database
        if ($id) {
            $ris = \App\Models\RequisitionIssueSlip::find($id);
            
            if (!$ris) {
                abort(404, 'Requisition Issue Slip not found');
            }

            // Prepare data from the model
            $data = [
                'ris_no' => $ris->ris_no ?? '',
                'entity_name' => $ris->entity_name ?? '',
                'fund_cluster' => $ris->fund_cluster ?? '',
                'division' => $ris->division ?? '',
                'responsibility_center_code' => $ris->responsibility_center_code ?? '',
                'office' => $ris->office ?? '',
                'purpose' => $ris->purpose ?? '',
                'items' => $ris->items ?? [],
                'requested_by_signature' => $ris->requested_by_signature ?? '',
                'requested_by_name' => $ris->requested_by_name ?? '',
                'requested_by_designation' => $ris->requested_by_designation ?? '',
                'requested_by_date' => $ris->requested_by_date ? $ris->requested_by_date->format('Y-m-d') : null,
                'approved_by_signature' => $ris->approved_by_signature ?? '',
                'approved_by_name' => $ris->approved_by_name ?? '',
                'approved_by_designation' => $ris->approved_by_designation ?? '',
                'approved_by_date' => $ris->approved_by_date ? $ris->approved_by_date->format('Y-m-d') : null,
                'issued_by_signature' => $ris->issued_by_signature ?? '',
                'issued_by_name' => $ris->issued_by_name ?? '',
                'issued_by_designation' => $ris->issued_by_designation ?? '',
                'issued_by_date' => $ris->issued_by_date ? $ris->issued_by_date->format('Y-m-d') : null,
                'received_by_signature' => $ris->received_by_signature ?? '',
                'received_by_name' => $ris->received_by_name ?? '',
                'received_by_designation' => $ris->received_by_designation ?? '',
                'received_by_date' => $ris->received_by_date ? $ris->received_by_date->format('Y-m-d') : null,
            ];

            $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', $data);
            return $pdf->stream('requisition_issue_slip_' . $ris->ris_no . '.pdf');
        }

        // If no ID is provided, use request data (for preview/generate)
        $data = $this->prepareData($request);

        $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', $data);

        return $pdf->stream('requisition_issue_slip.pdf');
    }

    private function prepareData(Request $request): array
    {
        $payload = $request->all();

        $items = collect($request->input('items', []))
            ->filter(fn($item) => filled($item['description'] ?? null))
            ->map(function ($item) {
                return [
                    'stock_no' => $item['stock_no'] ?? '',
                    'unit' => $item['unit'] ?? '',
                    'description' => $item['description'] ?? '',
                    'quantity' => $item['quantity'] ?? '',
                    'stock_available_yes' => $item['stock_available_yes'] ?? false,
                    'stock_available_no' => $item['stock_available_no'] ?? false,
                    'issue_quantity' => $item['issue_quantity'] ?? '',
                    'remarks' => $item['remarks'] ?? '',
                ];
            })
            ->values()
            ->all();

        if (empty($items)) {
            $items = [[
                'stock_no' => '',
                'unit' => '',
                'description' => '',
                'quantity' => '',
                'stock_available_yes' => false,
                'stock_available_no' => false,
                'issue_quantity' => '',
                'remarks' => '',
            ]];
        }

        $payload['items'] = $items;
        $payload['entity_name'] = $payload['entity_name'] ?? '';
        $payload['fund_cluster'] = $payload['fund_cluster'] ?? '';
        $payload['division'] = $payload['division'] ?? '';
        $payload['responsibility_center_code'] = $payload['responsibility_center_code'] ?? '';
        $payload['office'] = $payload['office'] ?? '';
        $payload['ris_no'] = $payload['ris_no'] ?? '';
        $payload['purpose'] = $payload['purpose'] ?? '';

        return $payload;
    }
}
