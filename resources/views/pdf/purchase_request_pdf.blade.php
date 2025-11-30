<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
    body { font-family: "Times New Roman", Times, serif; font-size: 12px; margin: 10px; }
        .title { text-align: center; font-weight: bold; margin-bottom: 6px; }
        .sub-title { text-align: center; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 6px; }
        thead th { background: #fff; }
        .no-border td { border: none; padding: 2px; }
        .right { text-align: right; }
        .center { text-align: center; }
    .small { font-family: "Times New Roman", Times, serif; font-size: 12px; }
        .purpose { border: 1px solid #000; padding: 6px; min-height: 40px; }
        .signature { padding-top: 30px; }
        .header-title {
            text-align: right;
            font-style: italic;
            font-size: 12pt;
            margin-bottom: 5px;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="header-title">Appendix 60</div>
    <div class="main-title">PURCHASE REQUEST</div>

    <table class="no-border" style="margin-bottom:6px; width:100%;">
        <tr>
            <td style="width:12%; padding:4px;"><strong>Entity Name:</strong></td>
            <td colspan="3" style="width:56%; padding:4px;">
                <div style="border-bottom:1px solid #000; display:inline-block; width:100%;">{{ $entity_name }}</div>
            </td>
            <td style="width:16%; padding:4px; text-align:right;"><strong>Fund Cluster:</strong></td>
            <td style="width:16%; padding:4px;">
                <div style="border-bottom:1px solid #000; display:inline-block; width:100%;">{{ $fund_cluster ?? '' }}</div>
            </td>
        </tr>
    </table>

    @php
        // Ensure variables exist and compute derived values to simplify template logic
        $items = $items ?? [];
        $rowsPerPage = $rows_per_page ?? 15;
        $filled = count($items);
        $rowsToAdd = max(0, $rowsPerPage - $filled);
        $totalCost = collect($items)->sum(fn($it) => floatval($it['total_cost'] ?? 0));
    @endphp

    <table>
        <thead>
            <tr>
                <th colspan="2" style="width:33%"></th>
                <th colspan="2" style="width:34%; text-align:left;">
                    <div><strong>PR No.:</strong> {{ $pr_no }}</div>
                    <div style="margin-top:4px;"><strong>Responsibility Center Code:</strong> {{ $responsibility_center_code ?? '' }}</div>
                </th>
                <th colspan="2" style="width:33%; text-align:left;"><strong>Date:</strong> {{ $date ?? '' }}</th>
            </tr>
            <tr>
                <th style="width:12%">Stock/<br>Property No.</th>
                <th style="width:8%">Unit</th>
                <th style="width:40%">Item Description</th>
                <th style="width:8%">Quantity</th>
                <th style="width:16%">Unit Cost</th>
                <th style="width:16%">Total Cost</th>
            </tr>
        </thead>
        <tbody>
            {{-- Render existing items first --}}
            @foreach($items as $index => $item)
            <tr>
                <td class="center">{{ $item['stock_no'] ?? ($index + 1) }}</td>
                <td class="center">{{ $item['unit'] ?? '' }}</td>
                <td>{{ $item['item_description'] }}</td>
                <td class="center">{{ $item['quantity'] }}</td>
                <td class="right">{{ number_format($item['unit_cost'] ?? 0, 2) }}</td>
                <td class="right">{{ number_format($item['total_cost'] ?? 0, 2) }}</td>
            </tr>
            @endforeach

            {{-- Add empty rows to match printed layout (default ~15 rows; override with $rows_per_page) --}}
            {{-- Fill remaining rows to match printed layout --}}
            @for($i = 0; $i < $rowsToAdd; $i++)
            <tr>
                <td style="padding:4px">&nbsp;</td>
                <td style="padding:4px">&nbsp;</td>
                <td style="padding:4px">&nbsp;</td>
                <td style="padding:4px">&nbsp;</td>
                <td style="padding:4px">&nbsp;</td>
                <td style="padding:4px">&nbsp;</td>
            </tr>
            @endfor

            <tr>
                <td colspan="5" class="right"><strong>TOTAL</strong></td>
                <td class="right"><strong>{{ number_format($totalCost, 2) }}</strong></td>
            </tr>

            {{-- Purpose and signatures merged into the same table --}}
            <tr>
                <td colspan="6" style="vertical-align:top;"><strong>Purpose:</strong></td>
            </tr>
            <tr>
                <td colspan="6" class="purpose">{{ $purpose }}</td>
            </tr>
            <tr>
                <!-- Signature, Printed Name, Designation (columns 1-2) -->
                <td colspan="2" style="padding:8px; vertical-align:top;">
                    <div style="text-align:center;">&nbsp;</div>
                    <div style="height:18px;"><strong>Signature:</strong></div>
                    <div style="height:18px;"><strong>Printed Name:</strong></div>
                    <div style="height:18px;"><strong>Designation:</strong></div>
                </td>

                <!-- Requested by (columns 3-4) -->
                <td colspan="2" style="padding:8px; vertical-align:top;">
                    <div style="text-align:center;"><strong>Requested by:</strong></div>
                    <div style="border-bottom:1px solid #000; height:18px;"></div>
                    <div style="border-bottom:1px solid #000; height:18px;"></div>
                    <div style="border-bottom:1px solid #000; height:18px;"></div>
                </td>

                <!-- Approved by (columns 5-6) -->
                <td colspan="2" style="padding:8px; vertical-align:top;">
                    <div style="text-align:center;"><strong>Approved by:</strong></div>
                    <div style="border-bottom:1px solid #000; height:18px;"></div>
                    <div style="border-bottom:1px solid #000; height:18px;"></div>
                    <div style="border-bottom:1px solid #000; height:18px;"></div>
                </td>
            </tr>
        </tbody>
    </table>

</body>
</html>
