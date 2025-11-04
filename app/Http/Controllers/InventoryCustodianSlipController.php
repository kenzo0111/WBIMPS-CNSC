<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class InventoryCustodianSlipController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $this->prepareData($request);

        $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

        try {
            \App\Models\Activity::create(['action' => 'Generated Inventory Custodian Slip PDF', 'meta' => json_encode(['info' => null])]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for ICS PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('inventory_custodian_slip.pdf');
    }

    public function preview(Request $request = null, $id = null)
    {
        // If an ID is provided, load the inventory custodian slip from the database
        if ($id) {
            $ics = \App\Models\InventoryCustodianSlip::find($id);
            
            if (!$ics) {
                abort(404, 'Inventory Custodian Slip not found');
            }

            // Prepare data from the model
            $data = [
                'entity_name' => $ics->entity_name ?? '',
                'fund_cluster' => $ics->fund_cluster ?? '',
                'items' => $ics->items ?? [],
                'grand_total' => $ics->grand_total ?? 0,
                'ics_no' => $ics->ics_no ?? '',
                'received_from' => $ics->received_from ?? '',
                'received_by_name' => $ics->received_by_name ?? '',
                'received_by_designation' => $ics->received_by_designation ?? '',
                'received_by_date' => $ics->received_by_date ? $ics->received_by_date->format('Y-m-d') : null,
            ];

            $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);
            return $pdf->stream('inventory_custodian_slip_' . ($ics->ics_no ?? $id) . '.pdf');
        }

        // If no ID is provided, use request data (for preview/generate)
        $data = $this->prepareData($request);

        $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

        return $pdf->stream('inventory_custodian_slip.pdf');
    }

    public function generateICS()
    {
        $pdf = Pdf::loadView('pdf.inventory_custodian_slip');
        return $pdf->setPaper('A4', 'portrait')->download('InventoryCustodianSlip.pdf');
    }

    private function prepareData(Request $request): array
    {
        $payload = $request->all();

        $items = collect($request->input('items', []))
            ->filter(fn($item) => filled($item['description'] ?? null))
            ->map(function ($item) {
                $quantity = (float) ($item['quantity'] ?? 0);
                $unitCost = (float) ($item['unit_cost'] ?? 0);

                return [
                    'quantity' => $quantity,
                    'unit' => $item['unit'] ?? '',
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantity * $unitCost,
                    'description' => $item['description'] ?? '',
                    'item_no' => $item['item_no'] ?? '',
                    'useful_life' => $item['useful_life'] ?? '',
                ];
            })
            ->values()
            ->all();

        if (empty($items)) {
            $items = [[
                'quantity' => 0,
                'unit' => '',
                'unit_cost' => 0,
                'total_cost' => 0,
                'description' => '',
                'item_no' => '',
                'useful_life' => '',
            ]];
        }

        $payload['items'] = $items;
        $payload['grand_total'] = collect($items)->sum('total_cost');
        $payload['entity_name'] = $payload['entity_name'] ?? '';
        $payload['fund_cluster'] = $payload['fund_cluster'] ?? '';

        return $payload;
    }
}
