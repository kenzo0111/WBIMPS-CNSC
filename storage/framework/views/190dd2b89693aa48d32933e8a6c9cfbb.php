<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Requisition and Issue Slip</title>
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
        .info-table {
            width: 100%;
            margin-bottom: 10px;
        }
        .info-table td {
            padding: 3px 5px;
            font-size: 9pt;
        }
        .info-table .label {
            font-weight: normal;
        }
        .info-table .field {
            border-bottom: 1px solid #000;
            min-width: 200px;
        }
        .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            border: 1px solid #000;
        }
        .main-table th,
        .main-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            font-size: 9pt;
        }
        .main-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-style: italic;
        }
        .main-table .section-header {
            font-weight: bold;
            font-style: italic;
            background-color: #ffffff;
        }
        .main-table td {
            height: 20px;
        }
        .purpose-section {
            margin-top: 10px;
            border: 1px solid #000;
            padding: 5px;
            min-height: 40px;
        }
        .purpose-section .label {
            font-weight: normal;
        }
        .signature-section {
            width: 100%;
            margin-top: 40px;
            border-collapse: collapse;
        }
        .signature-cell {
            width: 25%;
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

    <div style="text-align: right; font-style: italic; font-size: 12pt; margin-bottom: 5px;">Appendix 63</div>

    <div class="form-title">REQUISITION AND ISSUE SLIP</div>

    <table class="info-table">
        <tr>
            <td class="label">Entity Name :</td>
            <td class="field">Camarines Norte State College</td>
            <td style="width: 50px;"></td>
            <td class="label">Fund Cluster :</td>
            <td class="field"><?php echo e($stockOut->fund_cluster ?? ''); ?></td>
        </tr>
    </table>

    <table class="main-table">
        <thead>
            <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">Division : <?php echo e($stockOut->department ?? ''); ?></td>
                <td colspan="4" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">Responsibility Center Code : <?php echo e($stockOut->responsibility_center_code ?? ''); ?></td>
            </tr>
            <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">Office : </td>
                <td colspan="4" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">RIS No. : <?php echo e($stockOut->issue_id); ?></td>
            </tr>
            <tr>
                <th colspan="4" class="section-header">Requisition</th>
                <th colspan="2">Stock Available?</th>
                <th colspan="2" class="section-header">Issue</th>
            </tr>
            <tr>
                <th>Stock No.</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Yes</th>
                <th>No</th>
                <th>Quantity</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            <?php $__currentLoopData = $stockOutRecords; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $record): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <tr>
                <td><?php echo e($record->sku); ?></td>
                <td><?php echo e($record->unit ?? ''); ?></td>
                <td><?php echo e($record->product_name); ?></td>
                <td><?php echo e($record->quantity); ?></td>
                <td><span style="font-family: 'DejaVu Sans', sans-serif;">&#10004;</span></td>
                <td></td>
                <td><?php echo e($record->quantity); ?></td>
                <td></td>
            </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            <?php for($i = count($stockOutRecords); $i < 20; $i++): ?>
            <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
            </tr>
            <?php endfor; ?>
            <tr>
                <td colspan="8" style="text-align: left; padding: 5px; height: 50px; vertical-align: top;">
                    Purpose: <?php echo e($stockOut->purpose ?? ''); ?>

                </td>
            </tr>
            <tr>
                <th></th>
                <th colspan="2">Requested by:</th>
                <th colspan="2">Approved by:</th>
                <th>Issued by:</th>
                <th colspan="2">Received by:</th>
            </tr>
            <tr>
                <td>Signature :</td>
                <td colspan="2"></td>
                <td colspan="2"></td>
                <td></td>
                <td colspan="2"></td>
            </tr>
            <tr>
                <td>Printed Name :</td>
                <td colspan="2"><?php echo e($stockOut->issued_to ?? ''); ?></td>
                <td colspan="2"></td>
                <td><?php echo e($stockOut->issued_by ?? ''); ?></td>
                <td colspan="2"><?php echo e($stockOut->issued_to ?? ''); ?></td>
            </tr>
            <tr>
                <td>Designation :</td>
                <td colspan="2"></td>
                <td colspan="2"></td>
                <td></td>
                <td colspan="2"></td>
            </tr>
            <tr>
                <td>Date :</td>
                <td colspan="2"><?php echo e($stockOut->date_issued ? $stockOut->date_issued->format('m/d/Y') : ''); ?></td>
                <td colspan="2"></td>
                <td><?php echo e($stockOut->date_issued ? $stockOut->date_issued->format('m/d/Y') : ''); ?></td>
                <td colspan="2"><?php echo e($stockOut->date_issued ? $stockOut->date_issued->format('m/d/Y') : ''); ?></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Generated by Supply Management System on <?php echo e(now()->format('F d, Y h:i A')); ?>

    </div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/stock-out-receipt.blade.php ENDPATH**/ ?>