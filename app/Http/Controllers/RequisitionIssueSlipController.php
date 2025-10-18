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

    public function preview(Request $request)
    {
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
