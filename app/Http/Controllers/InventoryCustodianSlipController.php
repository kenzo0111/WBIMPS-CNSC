<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class InventoryCustodianSlipController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $request->all();

        $data['items'] = collect($request->input('items', []))
            ->filter(fn ($item) => filled($item['description'] ?? null))
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

        $data['grand_total'] = collect($data['items'])->sum('total_cost');

    $data['entity_name'] = $data['entity_name'] ?? 'Camarines Norte State College';
    $data['fund_cluster'] = $data['fund_cluster'] ?? '05-Internally Generated Fund';

        $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

        return $pdf->download('inventory_custodian_slip.pdf');
    }
}
