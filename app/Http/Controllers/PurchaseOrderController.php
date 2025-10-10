<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseOrderController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $request->all();

        $data['items'] = collect($request->input('items', []))
            ->filter(fn ($item) => filled($item['description'] ?? null))
            ->map(function ($item, $index) {
                $quantity = (float) ($item['quantity'] ?? 0);
                $unitCost = (float) ($item['unit_cost'] ?? 0);

                return [
                    'stock_number' => $item['stock_number'] ?? '',
                    'unit' => $item['unit'] ?? '',
                    'description' => $item['description'] ?? '',
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'amount' => $quantity * $unitCost,
                ];
            })
            ->values()
            ->all();

        $data['grand_total'] = collect($data['items'])->sum('amount');

        $data['entity_name'] = $data['entity_name'] ?? 'Camarines Norte State College';
        $data['fund_cluster'] = $data['fund_cluster'] ?? '05 - Internally Generated Fund';
        $data['delivery_term'] = $data['delivery_term'] ?? 'FOB Destination';
        $data['payment_term'] = $data['payment_term'] ?? '30 days';

        $pdf = Pdf::loadView('pdf.purchase_order_pdf', $data);

        return $pdf->download('purchase_order.pdf');
    }
}
