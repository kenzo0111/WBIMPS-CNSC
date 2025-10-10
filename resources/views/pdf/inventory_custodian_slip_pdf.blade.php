<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        html, body {
            margin: 0;
            padding: 0;
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
        }
        .sheet {
            max-width: 870px;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 32px 30px 26px;
            position: relative;
        }
        .annex {
            position: absolute;
            top: 18px;
            right: 30px;
            font-weight: 700;
            font-size: 14px;
        }
        .title {
            text-align: center;
            font-weight: 700;
            font-size: 18px;
            letter-spacing: .12em;
            margin-bottom: 22px;
        }
        .entity-details {
            margin-bottom: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 11px;
        }
        .entity-row {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .entity-label {
            font-weight: 700;
            white-space: nowrap;
        }
        .entity-value {
            flex: 1;
            border-bottom: 1px solid #000;
            min-height: 16px;
            padding: 0 6px 2px;
        }
        .entity-meta {
            display: flex;
            justify-content: space-between;
            gap: 16px;
        }
        .entity-meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .entity-meta-value {
            border-bottom: 1px solid #000;
            padding: 0 8px 2px;
            min-width: 160px;
        }
        .inventory-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .inventory-table th,
        .inventory-table td {
            border: 1px solid #000;
            padding: 5px 6px;
            text-align: center;
            vertical-align: middle;
        }
        .inventory-table th {
            font-weight: 700;
        }
        .inventory-table .description {
            text-align: left;
        }
        .inventory-table .qty { width: 9%; }
        .inventory-table .unit { width: 9%; }
        .inventory-table .unit-cost { width: 12%; }
        .inventory-table .total-cost { width: 13%; }
        .inventory-table .item-no { width: 14%; }
        .inventory-table .useful-life { width: 14%; }
        .total-row {
            margin-top: 10px;
            display: flex;
            justify-content: flex-end;
            font-weight: 700;
            font-size: 12px;
            letter-spacing: .06em;
        }
        .signatures {
            display: table;
            width: 100%;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            margin-top: 16px;
        }
        .signature-block {
            display: table-cell;
            width: 50%;
            padding: 18px 22px 58px;
            position: relative;
            border-right: 1px solid #000;
        }
        .signature-block:last-child {
            border-right: none;
        }
        .signature-title {
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: .06em;
        }
        .signature-line {
            position: absolute;
            left: 22px;
            right: 22px;
            bottom: 70px;
            border-bottom: 1px solid #000;
            height: 1px;
        }
        .signature-name,
        .signature-subtitle,
        .signature-position,
        .signature-date {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
        }
        .signature-name { bottom: 50px; font-weight: 700; font-size: 11px; }
        .signature-subtitle { bottom: 38px; }
        .signature-position { bottom: 24px; }
        .signature-date { bottom: 8px; }
        .reference {
            margin-top: 18px;
            display: table;
            width: 100%;
            font-size: 11px;
        }
        .reference-row {
            display: table-row;
        }
        .reference-cell {
            display: table-cell;
            padding: 4px 6px 0;
        }
        .reference-label {
            font-weight: 700;
            margin-right: 4px;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    @php
        $items = collect($items ?? [])->values();
        $displayRows = $items->map(function ($item) {
            return [
                'quantity' => $item['quantity'] ?? '',
                'unit' => $item['unit'] ?? '',
                'unit_cost' => $item['unit_cost'] ?? '',
                'total_cost' => $item['total_cost'] ?? '',
                'description' => $item['description'] ?? '',
                'item_no' => $item['item_no'] ?? '',
                'useful_life' => $item['useful_life'] ?? '',
            ];
        });

        $minimumRows = 7;
        while ($displayRows->count() < $minimumRows) {
            $displayRows->push([
                'quantity' => '',
                'unit' => '',
                'unit_cost' => '',
                'total_cost' => '',
                'description' => '',
                'item_no' => '',
                'useful_life' => '',
            ]);
        }

        $grandTotal = $grand_total ?? $items->sum('total_cost');
    @endphp

    <div class="sheet">
        <div class="annex">Annex A.3</div>
        <div class="title">INVENTORY CUSTODIAN SLIP</div>

        <div class="entity-details">
            <div class="entity-row">
                <span class="entity-label">Entity Name :</span>
                <span class="entity-value">{{ $entity_name ?? 'Camarines Norte State College' }}</span>
            </div>
            <div class="entity-meta">
                <div class="entity-meta-item">
                    <span class="entity-label">Fund Cluster :</span>
                    <span class="entity-meta-value">{{ $fund_cluster }}</span>
                </div>
                <div class="entity-meta-item">
                    <span class="entity-label">ICS No. :</span>
                    <span class="entity-meta-value">{{ $ics_number }}</span>
                </div>
            </div>
        </div>

        <table class="inventory-table">
            <thead>
                <tr>
                    <th rowspan="2" class="qty">Quantity</th>
                    <th rowspan="2" class="unit">Unit</th>
                    <th colspan="2">Amount</th>
                    <th rowspan="2" class="description">Description</th>
                    <th rowspan="2" class="item-no">Item No.</th>
                    <th rowspan="2" class="useful-life">Estimated Useful Life</th>
                </tr>
                <tr>
                    <th class="unit-cost">Unit Cost</th>
                    <th class="total-cost">Total Cost</th>
                </tr>
            </thead>
            <tbody>
                @foreach($displayRows as $row)
                    <tr>
                        <td>{{ $row['quantity'] !== '' ? number_format((float) $row['quantity'], 2) : '' }}</td>
                        <td>{{ $row['unit'] }}</td>
                        <td>{{ $row['unit_cost'] !== '' ? number_format((float) $row['unit_cost'], 2) : '' }}</td>
                        <td>{{ $row['total_cost'] !== '' ? number_format((float) $row['total_cost'], 2) : '' }}</td>
                        <td class="description">{{ $row['description'] }}</td>
                        <td>{{ $row['item_no'] }}</td>
                        <td>{{ $row['useful_life'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="total-row">
            <span style="margin-right: 12px;">TOTAL</span>
            <span>{{ number_format((float) $grandTotal, 2) }}</span>
        </div>

        <div class="signatures">
            <div class="signature-block">
                <div class="signature-title">Received from :</div>
                <div class="signature-line"></div>
                <div class="signature-name">{{ $received_from }}</div>
                <div class="signature-subtitle">Signature Over Printed Name</div>
                <div class="signature-position">{{ $received_from_position }}</div>
                <div class="signature-date">Date: {{ $received_from_date ? \Carbon\Carbon::parse($received_from_date)->format('F d, Y') : '' }}</div>
            </div>
            <div class="signature-block">
                <div class="signature-title">Received by:</div>
                <div class="signature-line"></div>
                <div class="signature-name">{{ $received_by }}</div>
                <div class="signature-subtitle">Signature Over Printed Name</div>
                <div class="signature-position">{{ $received_by_position }}</div>
                <div class="signature-date">Date: {{ $received_by_date ? \Carbon\Carbon::parse($received_by_date)->format('F d, Y') : '' }}</div>
            </div>
        </div>
    </div>
</body>
</html>