<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #000; padding: 4px; }
        .header { text-align: center; margin-bottom: 5px; }
    </style>
</head>
<body>
    <h4 class="header">PURCHASE REQUEST</h4>
    <table>
        <tr>
            <td colspan="2">Entity Name: {{ $entity_name }}</td>
            <td>PR No.: {{ $pr_no }}</td>
            <td>Date: {{ $date }}</td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th>Stock/Property No.</th>
                <th>Unit</th>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>units</td>
                <td>{{ $item['item_description'] }}</td>
                <td>{{ $item['quantity'] }}</td>
                <td>{{ $item['unit_cost'] }}</td>
                <td>{{ $item['total_cost'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <p><strong>Purpose:</strong> {{ $purpose }}</p>

    <table style="margin-top: 30px;">
        <tr>
            <td style="width: 50%;">
                <p>Requested by:<br><br>______________________________<br>
                {{ $requested_by }}<br>{{ $designation }}</p>
            </td>
            <td style="width: 50%;">
                <p>Approved by:<br><br>______________________________<br>
                {{ $approved_by }}<br>{{ $approved_position }}</p>
            </td>
        </tr>
    </table>
</body>
</html>
