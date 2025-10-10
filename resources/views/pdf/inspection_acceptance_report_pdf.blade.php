<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }
        .no-border td { border: none; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .small { font-size: 10px; }
        .fw-bold { font-weight: bold; }
        .mt-2 { margin-top: 12px; }
        .mt-3 { margin-top: 18px; }
    </style>
</head>

<body>
    <table class="no-border" style="margin-bottom: 6px;">
        <tr>
            <td style="font-size: 12px; font-weight: bold; text-transform: uppercase;">{{ $entity_name ?? 'Camarines Norte State College' }}</td>
            <td style="text-align: right; font-size: 12px; font-weight: bold; text-transform: uppercase;">Inspection and Acceptance Report</td>
        </tr>
        <tr>
            <td>Supplier: {{ $supplier_name }}</td>
            <td style="text-align: right;">IAR No.: {{ $iar_number }}</td>
        </tr>
        <tr>
            <td>Fund Cluster: {{ $fund_cluster }}</td>
            <td style="text-align: right;">Date: {{ $iar_date ? \Carbon\Carbon::parse($iar_date)->format('F d, Y') : '' }}</td>
        </tr>
    </table>

    <table>
        <tr>
            <td style="width: 25%;">PO No.: {{ $po_number }}</td>
            <td style="width: 25%;">PO Date: {{ $po_date ? \Carbon\Carbon::parse($po_date)->format('F d, Y') : '' }}</td>
            <td style="width: 25%;">Delivery Receipt No.: {{ $delivery_receipt }}</td>
            <td style="width: 25%;">Invoice No.: {{ $invoice_number }}</td>
        </tr>
        <tr>
            <td colspan="2">Requisitioning Office/Dept.: {{ $requisition_office }}</td>
            <td colspan="2">Responsibility Center Code: {{ $responsibility_code }}</td>
        </tr>
    </table>

    <table class="mt-3">
        <thead>
            <tr>
                <th style="width: 12%">Stock/Property No.</th>
                <th style="width: 10%">Unit</th>
                <th style="width: 12%">Quantity</th>
                <th>Description</th>
                <th style="width: 20%">Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach(($items ?? []) as $line)
                <tr>
                    <td>{{ $line['stock_number'] ?? '' }}</td>
                    <td>{{ $line['unit'] ?? '' }}</td>
                    <td class="text-right">{{ $line['quantity'] ?? '' }}</td>
                    <td>{{ $line['description'] ?? '' }}</td>
                    <td>{{ $line['remarks'] ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="mt-3">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <div style="font-weight: bold; text-transform: uppercase;">Inspection</div>
                <p class="small">{!! (($inspection_status ?? 'complete') === 'complete') ? '&#x2611;' : '&#x2610;' !!} Inspected, verified and found in order as to quantity and specifications</p>
                <p class="small">{!! (($inspection_status ?? '') === 'partial') ? '&#x2611;' : '&#x2610;' !!} Partial (please specify)</p>
                <p class="small">Remarks: {{ $inspection_remarks }}</p>
                <div class="text-center" style="margin-top: 42px;">
                    <div>______________________________</div>
                    <div class="small" style="font-weight: bold;">{{ $inspection_officer }}</div>
                    <div class="small">{{ $inspection_officer_position }}</div>
                    <div class="small">Date: {{ $inspection_date ? \Carbon\Carbon::parse($inspection_date)->format('F d, Y') : '' }}</div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
                <div style="font-weight: bold; text-transform: uppercase;">Acceptance</div>
                <p class="small">Date Received: {{ $acceptance_date ? \Carbon\Carbon::parse($acceptance_date)->format('F d, Y') : '' }}</p>
                <p class="small">{!! (($acceptance_status ?? 'complete') === 'complete') ? '&#x2611;' : '&#x2610;' !!} Complete &nbsp;&nbsp; {!! (($acceptance_status ?? '') === 'partial') ? '&#x2611;' : '&#x2610;' !!} Partial</p>
                <p class="small">Remarks: {{ $acceptance_remarks }}</p>
                <div class="text-center" style="margin-top: 42px;">
                    <div>______________________________</div>
                    <div class="small" style="font-weight: bold;">{{ $acceptance_officer }}</div>
                    <div class="small">{{ $acceptance_officer_position }}</div>
                </div>
            </td>
        </tr>
    </table>

</body>

</html>