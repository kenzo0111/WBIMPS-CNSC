<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; }
        h1, h2, h3, h4 { margin: 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .uppercase { text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }
        .no-border td { border: none; }
        .signature-space { padding-top: 40px; }
        .small { font-size: 10px; }
        .mt-2 { margin-top: 12px; }
        .mt-3 { margin-top: 18px; }
        .mb-1 { margin-bottom: 4px; }
    </style>
</head>

<body>
    @php
        if (!function_exists('spmo_number_to_words')) {
            function spmo_number_to_words($number)
            {
                $units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                $scales = ['', ' Thousand', ' Million', ' Billion'];

                $number = round($number, 2);
                $whole = (int) floor($number);
                $cents = (int) round(($number - $whole) * 100);

                if ($whole === 0) {
                    $word = 'Zero';
                } else {
                    $word = '';
                    $scale = 0;
                    while ($whole > 0) {
                        $chunk = $whole % 1000;
                        if ($chunk) {
                            $chunkWords = '';
                            if ($chunk > 99) {
                                $chunkWords .= $units[(int) ($chunk / 100)] . ' Hundred ';
                                $chunk = $chunk % 100;
                            }
                            if ($chunk > 19) {
                                $chunkWords .= $tens[(int) ($chunk / 10)];
                                if ($chunk % 10) $chunkWords .= '-' . $units[$chunk % 10];
                            } elseif ($chunk > 0) {
                                $chunkWords .= $units[$chunk];
                            }
                            $word = trim($chunkWords) . $scales[$scale] . ($word ? ' ' . $word : '');
                        }
                        $whole = (int) ($whole / 1000);
                        $scale++;
                    }
                }

                $result = trim($word) . ' Pesos';
                if ($cents > 0) {
                    $result .= ' and ' . str_pad((string) $cents, 2, '0', STR_PAD_LEFT) . '/100';
                } else {
                    $result .= ' Only';
                }

                return $result;
            }
        }

        $items = $items ?? [];
        $grandTotal = $grand_total ?? collect($items)->sum('amount');
    $amountWords = ($amount_in_words ?? '') ?: spmo_number_to_words($grandTotal);
    @endphp

    <table class="no-border" style="margin-bottom: 6px;">
        <tr>
            <td style="width: 65%; font-size: 13px; font-weight: bold;" class="uppercase">{{ $entity_name ?? 'Camarines Norte State College' }}</td>
            <td style="width: 35%; font-size: 14px; text-align: right; font-weight: bold;" class="uppercase">Purchase Order</td>
        </tr>
    </table>

    <table>
        <tr>
            <td colspan="4" style="font-weight: bold;">Supplier: {{ strtoupper($supplier_name ?? '') }}</td>
        </tr>
        <tr>
            <td colspan="4">Address: {{ $supplier_address }}</td>
        </tr>
        <tr>
            <td style="width: 25%;">TIN: {{ $supplier_tin }}</td>
            <td style="width: 25%;">PO No.: {{ $po_number }}</td>
            <td style="width: 25%;">Date: {{ $po_date ? \Carbon\Carbon::parse($po_date)->format('F d, Y') : '' }}</td>
            <td style="width: 25%;">Mode of Procurement: {{ $mode_of_procurement }}</td>
        </tr>
        <tr>
            <td colspan="4">Gentlemen: Please furnish this Office the following articles subject to the terms and conditions contained herein:</td>
        </tr>
        <tr>
            <td>Place of Delivery: {{ $place_of_delivery }}</td>
            <td>Date of Delivery: {{ $date_of_delivery }}</td>
            <td>Delivery Term: {{ $delivery_term }}</td>
            <td>Payment Term: {{ $payment_term }}</td>
        </tr>
        <tr>
            <td colspan="4">Amount in Words: {{ $amountWords }}</td>
        </tr>
    </table>

    <table class="mt-3">
        <thead>
            <tr>
                <th style="width: 13%">Stock/Property No.</th>
                <th style="width: 8%">Unit</th>
                <th>Description</th>
                <th style="width: 10%">Quantity</th>
                <th style="width: 12%">Unit Cost</th>
                <th style="width: 12%">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $line)
                <tr>
                    <td>{{ $line['stock_number'] ?? '' }}</td>
                    <td>{{ $line['unit'] ?? '' }}</td>
                    <td>{{ $line['description'] ?? '' }}</td>
                    <td class="text-right">{{ number_format((float) ($line['quantity'] ?? 0), 2) }}</td>
                    <td class="text-right">{{ number_format((float) ($line['unit_cost'] ?? 0), 2) }}</td>
                    <td class="text-right">{{ number_format((float) ($line['amount'] ?? 0), 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="5" class="text-right"><strong>Total</strong></td>
                <td class="text-right"><strong>{{ number_format($grandTotal, 2) }}</strong></td>
            </tr>
        </tfoot>
    </table>

    <div class="mt-2">
        <p class="small"><strong>Penalty Clause:</strong> {{ $notes ?: 'In case of failure to make the full delivery within the time specified above, a penalty of one-tenth (1/10) of one percent for every day of delay shall be imposed.' }}</p>
    </div>

    <table class="no-border mt-3">
        <tr>
            <td style="width: 34%; vertical-align: top;">
                <div class="small" style="font-weight: bold;">Conforme:</div>
                <div style="margin-top: 50px; border-top: 1px solid #000; text-align: center; padding-top: 4px;">
                    <div class="small" style="font-weight: bold;">{{ $supplier_representative }}</div>
                    <div class="small">{{ $supplier_representative_title }}</div>
                    <div class="small">Date: {{ $conforme_date }}</div>
                </div>
            </td>
            <td style="width: 33%; vertical-align: top;">
                <div class="small" style="font-weight: bold;">Very truly yours,</div>
                <div style="margin-top: 50px; border-top: 1px solid #000; text-align: center; padding-top: 4px;">
                    <div class="small" style="font-weight: bold;">{{ $authorized_official }}</div>
                    <div class="small">{{ $authorized_official_position }}</div>
                </div>
            </td>
            <td style="width: 33%; vertical-align: top;">
                <div class="small" style="font-weight: bold;">Funds Available:</div>
                <div style="margin-top: 50px; border-top: 1px solid #000; text-align: center; padding-top: 4px;">
                    <div class="small" style="font-weight: bold;">{{ $accountant }}</div>
                    <div class="small">{{ $accountant_position }}</div>
                </div>
            </td>
        </tr>
    </table>

    <table class="mt-2">
        <tr>
            <td style="width: 30%;">Funds Available: {{ $funds_available }}</td>
            <td style="width: 23%;">ORS/BURS No.: {{ $ors_burs_no }}</td>
            <td style="width: 23%;">Date: {{ $ors_burs_date }}</td>
            <td>Amount: {{ $ors_burs_amount }}</td>
        </tr>
    </table>

</body>

</html>