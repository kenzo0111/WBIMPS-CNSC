<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Stock Out Receipt</title>
    <style>
        @page {
            size: A4;
            margin: 30px;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            margin-bottom: 20px;
        }
        .header-logo {
            width: 15%;
            text-align: center;
            vertical-align: middle;
        }
        .header-text {
            width: 70%;
            text-align: center;
            vertical-align: middle;
        }
        .school-name {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .office-name {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .address {
            font-size: 9pt;
        }
        .form-title {
            text-align: center;
            font-weight: bold;
            font-size: 14pt;
            margin-top: 20px;
            margin-bottom: 20px;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .content-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .content-table th, .content-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: middle;
        }
        .content-table th {
            background-color: #f0f0f0;
            text-align: left;
            width: 30%;
            font-weight: bold;
        }
        .signature-section {
            width: 100%;
            margin-top: 40px;
            border-collapse: collapse;
        }
        .signature-cell {
            width: 50%;
            padding: 10px;
            vertical-align: top;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 80%;
            margin: 40px auto 5px auto;
            text-align: center;
            font-weight: bold;
        }
        .signature-label {
            text-align: center;
            font-size: 9pt;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #666;
            padding: 10px 0;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <table class="header-table">
        <tr>
            <td class="header-logo">
                <?php if(extension_loaded('gd')): ?>
                    <img src="<?php echo e(public_path('images/UCN1.png')); ?>" width="80" alt="Logo">
                <?php else: ?>
                    <div style="padding: 10px; border: 1px dashed #ccc; font-size: 8pt;">(Enable GD for Logo)</div>
                <?php endif; ?>
            </td>
            <td class="header-text">
                <div class="school-name">Camarines Norte State College</div>
                <div class="address">Daet, Camarines Norte</div>
                <div class="office-name">SUPPLY AND PROPERTY MANAGEMENT OFFICE</div>
            </td>
            <td class="header-logo">
                <!-- Spacer for balance -->
            </td>
        </tr>
    </table>

    <div class="form-title">STOCK OUT RECEIPT</div>

    <table class="content-table">
        <tr>
            <th>Issue ID</th>
            <td><?php echo e($stockOut->issue_id); ?></td>
        </tr>
        <tr>
            <th>Transaction ID</th>
            <td><?php echo e($stockOut->transaction_id); ?></td>
        </tr>
        <tr>
            <th>Date Issued</th>
            <td><?php echo e($stockOut->date_issued ? $stockOut->date_issued->format('F d, Y') : ''); ?></td>
        </tr>
        <tr>
            <th>Item Name</th>
            <td><?php echo e($stockOut->product_name); ?></td>
        </tr>
        <tr>
            <th>SKU</th>
            <td><?php echo e($stockOut->sku); ?></td>
        </tr>
        <tr>
            <th>Quantity</th>
            <td><?php echo e($stockOut->quantity); ?></td>
        </tr>
        <tr>
            <th>Unit Cost</th>
            <td><span style="font-family: DejaVu Sans;">&#8369;</span> <?php echo e(number_format($stockOut->unit_cost, 2)); ?></td>
        </tr>
        <tr>
            <th>Total Cost</th>
            <td><span style="font-family: DejaVu Sans;">&#8369;</span> <?php echo e(number_format($stockOut->total_cost, 2)); ?></td>
        </tr>
        <tr>
            <th>Department</th>
            <td><?php echo e($stockOut->department); ?></td>
        </tr>
        <tr>
            <th>Purpose</th>
            <td><?php echo e($stockOut->purpose); ?></td>
        </tr>
    </table>

    <table class="signature-section">
        <tr>
            <td class="signature-cell">
                <div><strong>Issued By:</strong></div>
                <div class="signature-line"><?php echo e($stockOut->issued_by); ?></div>
                <div class="signature-label">Signature over Printed Name</div>
            </td>
            <td class="signature-cell">
                <div><strong>Received By:</strong></div>
                <div class="signature-line"><?php echo e($stockOut->issued_to); ?></div>
                <div class="signature-label">Signature over Printed Name</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Generated by Supply Management System on <?php echo e(now()->format('F d, Y h:i A')); ?>

    </div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/stock-out-receipt.blade.php ENDPATH**/ ?>