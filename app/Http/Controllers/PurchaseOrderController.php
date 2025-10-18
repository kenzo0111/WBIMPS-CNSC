<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PurchaseOrderController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $request->all();

        // Debug: log the incoming payload to help track problematic fields
        logger()->debug('generatePDF payload', is_array($data) ? $data : ['payload' => $data]);

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

        // Sanitize date fields to avoid passing free-text like "WITHIN 30 DAYS"
        $data['date_of_purchase'] = $this->safeDateForBlade($data['date_of_purchase'] ?? null);
        $data['date_of_delivery'] = $this->safeDateForBlade($data['date_of_delivery'] ?? null);
        $data['ors_burs_date'] = $this->safeDateForBlade($data['ors_burs_date'] ?? null);

        $pdf = Pdf::loadView('pdf.purchase_order_pdf', $data)->setPaper('a4', 'portrait');

        // Record activity
        try {
            \App\Models\Activity::create(['action' => 'Generated Purchase Order PDF', 'meta' => json_encode(['po' => $data['po_number'] ?? null])]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for PurchaseOrder PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('purchase_order.pdf');
    }

    /**
     * Convert incoming value to a YYYY-MM-DD date string for the Blade view
     * or return null when not parseable. This prevents Carbon::parse from
     * throwing when it receives non-date textual inputs like "WITHIN 30 DAYS".
     */
    private function safeDateForBlade($value)
    {
        if (empty($value)) {
            return null;
        }

        // Quick blacklist for common non-date textual phrases that users enter
        // (defensive: avoids attempting to parse free-text like "WITHIN 30 DAYS").
        if (is_string($value)) {
            $normalized = trim(strtolower($value));
            $blacklist = [
                'within 30 days',
                'within 30 day',
                'within 7 days',
                'as soon as possible',
                'tbd',
                'tba',
                'n/a',
                'na',
                '-',
            ];

            foreach ($blacklist as $bad) {
                if ($normalized === $bad) {
                    return null;
                }
            }
        }

        try {
            // numeric timestamp? handle seconds (10 digits) and milliseconds (13 digits)
            if (is_numeric($value)) {
                $v = (string) $value;
                if (strlen($v) === 10) {
                    $dt = Carbon::createFromTimestamp((int) $value);
                } elseif (strlen($v) === 13) {
                    $dt = Carbon::createFromTimestampMs((int) $value);
                } else {
                    // fallback
                    $dt = Carbon::parse($value);
                }
            } else {
                $dt = Carbon::parse($value);
            }

            return $dt->format('Y-m-d');
        } catch (\Throwable $e) {
            // Log at debug level so we can inspect problematic payloads if needed
            logger()->debug('safeDateForBlade: could not parse date', ['value' => $value, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Render a preview of the purchase order view with sample data.
     * This returns the HTML view (not a PDF) so you can preview in browser.
     */
    public function preview()
    {
        // Provide empty/blank data so the preview renders a clean sheet (layout only)
        $sample = [
            'supplier' => '',
            'supplier_address' => '',
            'po_number' => '',
            'date_of_purchase' => null,
            'tin_number' => '',
            'mode_of_procurement' => '',
            'place_of_delivery' => '',
            'delivery_term' => '',
            'date_of_delivery' => null,
            'payment_term' => '',
            'items' => [],
            'notes' => '',
            'fund_cluster' => '',
            'ors_burs_no' => '',
            'funds_available' => '',
            'ors_burs_date' => null,
            'ors_burs_amount' => '',
            'accountant_signature' => '',
            'entity_name' => '',
            'entity_address' => '',
            'grand_total' => 0,
        ];

        // Generate PDF and stream to browser for preview (blank template)
    $pdf = Pdf::loadView('pdf.purchase_order_pdf', $sample)->setPaper('a4', 'portrait');

    return $pdf->stream('purchase_order_preview.pdf');
    }
}
