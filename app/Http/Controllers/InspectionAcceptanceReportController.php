<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class InspectionAcceptanceReportController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $request->all();

        $data['items'] = collect($request->input('items', []))
            ->filter(fn ($item) => filled($item['description'] ?? null))
            ->map(function ($item) {
                return [
                    'stock_number' => $item['stock_number'] ?? '',
                    'description' => $item['description'] ?? '',
                    'unit' => $item['unit'] ?? '',
                    'quantity' => $item['quantity'] ?? '',
                    'remarks' => $item['remarks'] ?? '',
                ];
            })
            ->values()
            ->all();

        $data['entity_name'] = $data['entity_name'] ?? 'Camarines Norte State College';
        $data['fund_cluster'] = $data['fund_cluster'] ?? '05-Internally Generated Fund';

        $pdf = Pdf::loadView('pdf.inspection_acceptance_report_pdf', $data);

        return $pdf->download('inspection_acceptance_report.pdf');
    }
}
