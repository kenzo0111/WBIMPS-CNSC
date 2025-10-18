<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;


class PurchaseRequestController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $request->all();

        $items = collect($request->input('items', []))
            ->filter(fn ($item) => filled($item['item_description'] ?? $item['description'] ?? null))
            ->map(function ($item) {
                $quantity = (float) ($item['quantity'] ?? 0);
                $unitCost = (float) ($item['unit_cost'] ?? 0);

                return [
                    'item_description' => $item['item_description'] ?? $item['description'] ?? '',
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $item['total_cost'] ?? $quantity * $unitCost,
                ];
            });

        if ($items->isEmpty()) {
            $descriptions = collect($request->input('item_description', []));
            $quantities = collect($request->input('quantity', []));
            $unitCosts = collect($request->input('unit_cost', []));
            $totals = collect($request->input('total_cost', []));

            $items = $descriptions->map(function ($description, $index) use ($quantities, $unitCosts, $totals) {
                $quantity = (float) ($quantities->get($index) ?? 0);
                $unitCost = (float) ($unitCosts->get($index) ?? 0);

                return [
                    'item_description' => $description,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totals->get($index) ?? $quantity * $unitCost,
                ];
            })->filter(fn ($item) => filled($item['item_description']));
        }

        $data['items'] = $items->values()->all();

        $data['entity_name'] = $data['entity_name'] ?? 'Camarines Norte State College';

        $pdf = Pdf::loadView('pdf.purchase_request_pdf', $data);
        try {
            \App\Models\Activity::create(['action' => 'Generated Purchase Request PDF', 'meta' => json_encode(['pr_no' => $data['pr_no'] ?? null])]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for PurchaseRequest PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('purchase_request.pdf');
    }

    /**
     * Stream a blank A4 preview of the purchase request PDF.
     */
    public function preview()
    {
        $sample = [
            'entity_name' => '',
            // PR specific fields expected by the blade
            'pr_no' => '',
            'date' => Carbon::now()->toDateString(),
            'purpose' => '',
            'requested_by' => '',
            'designation' => '',
            'approved_by' => '',
            'approved_position' => '',
            // items should be an array of item arrays with keys used in the view
            'items' => [],
        ];

        $pdf = Pdf::loadView('pdf.purchase_request_pdf', $sample)->setPaper('a4', 'portrait');

        return $pdf->stream('purchase_request_preview.pdf');
    }
}
