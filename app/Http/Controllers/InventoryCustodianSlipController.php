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

        return $pdf->download('inventory_custodian_slip.pdf');
    }

    public function preview(Request $request)
    {
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
        $payload['entity_name'] = $payload['entity_name'] ?? 'Camarines Norte State College';
        $payload['fund_cluster'] = $payload['fund_cluster'] ?? '05-Internally Generated Fund';

        return $payload;
    }
}
