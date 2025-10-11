<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Inventory Custodian Slip</title>
    <style>
        @page { size: A4; margin: 30px 25px 35px 25px; }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            color: #000;
        }


        .annex {
            position: absolute;
            top: 1px;
            right: 22px;
            font-weight: bold;
            font-size: 12px;
        }

        .title {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            letter-spacing: 0.04em;
            margin-bottom: 30px;
        }

        .meta {
            font-size: 11px;
            margin-bottom: 8px;
        }

        .meta-row {
            margin-bottom: 6px;
            line-height: 1.4;
        }

        .meta-row.flex {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }

        .meta-row.flex > div {
            display: flex;
            align-items: baseline;
        }

        .meta-row.flex .right-column {
            margin-left: auto;
            text-align: right;
        }

        .meta .label {
            font-weight: bold;
            margin-right: 3px;
        }

        .value-line {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 220px;
            padding-bottom: 2px;
        }

        .value-line.short {
            min-width: 140px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: top;
            word-break: break-word;
        }

        th {
            text-align: center;
            font-weight: bold;
        }

        td {
            text-align: center;
            height: 24px;
            font-size: 11px;
        }

        td.description {
            text-align: left;
            padding-left: 8px;
            line-height: 1.35;
        }

        .qty { width: 6%; }
        .unit { width: 8%; }
        .unit-cost { width: 11%; }
        .total-cost { width: 11%; }
        .description { width: 38%; }
        .item-no { width: 13%; }
        .useful-life { width: 13%; }

        .total {
            font-weight: bold;
            text-align: right;
            padding-top: 8px;
            margin-right: 4px;
            width: 100%;
        }

        .total-row {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-top: 8px;
            border-spacing: 0;
        }

        .total-cell {
            display: table-cell;
            text-align: center;
            vertical-align: middle;
            padding: 4px 6px;
        }

        .total-cell:nth-child(1) { width: 6%; border-right: 1px solid transparent; }
        .total-cell:nth-child(2) { width: 8%; border-right: 1px solid transparent; }
        .total-cell:nth-child(3) { 
            width: 11%;
            font-weight: bold;
            border-right: 1px solid transparent;
        }
        .total-cell:nth-child(4) { 
            width: 11%; 
            font-weight: bold;
            border-right: 1px solid transparent;
        }
        .total-cell:nth-child(5) { width: 38%; border-right: 1px solid transparent; }
        .total-cell:nth-child(6) { width: 13%; border-right: 1px solid transparent; }
        .total-cell:nth-child(7) { width: 13%; }

        .signatures {
            width: 100%;
            border-top: 1px solid #000;
            margin-top: 16px;
            padding-top: 12px;
            display: table;
        }

        .sig-block {
            display: table-cell;
            width: 50%;
            padding: 0 10px;
            vertical-align: top;
        }

        .sig-label {
            text-align: left;
            font-weight: bold;
            margin-bottom: 35px;
            font-size: 11px;
        }

        .sig-line {
            width: 100%;
            border-bottom: 1px solid #000;
            margin-bottom: 3px;
        }

        .sig-name {
            font-weight: bold;
            font-size: 11px;
            text-align: center;
            margin-bottom: 2px;
        }

        .sig-subtext {
            font-size: 10px;
            line-height: 1.4;
            text-align: center;
            color: #c00;
        }
        
        .sig-subtext.position {
            color: #000;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="annex">Annex A.3</div>

        <div class="title">INVENTORY CUSTODIAN SLIP</div>

        <div class="meta">
            <div class="meta-row flex">
                <div>
                    <span class="label">Entity Name :</span>
                    <span class="value-line"><?php echo e($entity_name ?? ''); ?></span>
                </div>
            </div>
            <div class="meta-row flex">
                <div>
                    <span class="label">Fund Cluster :</span>
                    <span class="value-line"><?php echo e($fund_cluster ?? ''); ?></span>
                </div>
                <div class="right-column">
                    <span class="label">ICS No. :</span>
                    <span class="value-line short"><?php echo e($ics_number ?? ''); ?></span>
                </div>
            </div>
        </div>

        <?php
            $renderItems = $items;
            $minimumRows = 10;
            $currentCount = count($renderItems);
            for ($i = $currentCount; $i < $minimumRows; $i++) {
                $renderItems[] = [
                    'quantity' => '',
                    'unit' => '',
                    'unit_cost' => '',
                    'total_cost' => '',
                    'description' => '',
                    'item_no' => '',
                    'useful_life' => '',
                ];
            }
        ?>

        <table>
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
                <?php $__currentLoopData = $renderItems; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $entry): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <tr>
                    <td><?php echo e($entry['quantity']); ?></td>
                    <td><?php echo e($entry['unit']); ?></td>
                    <td><?php echo e($entry['unit_cost'] === '' ? '' : number_format((float) $entry['unit_cost'], 2)); ?></td>
                    <td><?php echo e($entry['total_cost'] === '' ? '' : number_format((float) $entry['total_cost'], 2)); ?></td>
                    <td class="description"><?php echo $entry['description'] === '' ? '&nbsp;' : nl2br(e($entry['description'])); ?></td>
                    <td><?php echo e($entry['item_no']); ?></td>
                    <td><?php echo e($entry['useful_life']); ?></td>
                </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                <tr class="total-row-table">
                    <td></td>
                    <td></td>
                    <td style="font-weight: bold;">TOTAL</td>
                    <td style="font-weight: bold;"><?php echo e(number_format($grand_total, 2)); ?></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="7" style="border-left: none; border-right: none; border-bottom: none; border-top: 1px solid #000; padding: 12px 0;">
                        <div class="signatures" style="border-top: none; margin-top: 0;">
                            <div class="sig-block">
                                <div class="sig-label">Received from :</div>
                                <div class="sig-line"></div>
                                <div class="sig-name"><?php echo e($received_from ?? 'ARSENIO GEM A. GARCILLANOSA'); ?></div>
                                <div class="sig-subtext">Signature Over Printed Name</div>
                                <div class="sig-subtext position"><?php echo e($received_from_position ?? 'Supply Officer III/Admin Officer V'); ?></div>
                                <div class="sig-subtext position"><?php echo e($received_from_date ?? ''); ?></div>
                            </div>

                            <div class="sig-block">
                                <div class="sig-label">Received by:</div>
                                <div class="sig-line"></div>
                                <div class="sig-name"><?php echo e($received_by ?? ''); ?></div>
                                <div class="sig-subtext">Signature Over Printed Name</div>
                                <div class="sig-subtext position"><?php echo e($received_by_position ?? ''); ?></div>
                                <div class="sig-subtext position"><?php echo e($received_by_date ?? ''); ?></div>
                            </div>
                        </div>
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
</body>
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/inventory_custodian_slip_pdf.blade.php ENDPATH**/ ?>