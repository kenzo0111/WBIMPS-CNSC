<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Inventory Custodian Slip</title>
    <style>
        @page { size: A4; margin: 30px 25px 35px 25px; }
        body { font-family: 'Times New Roman', serif; font-size: 11px; color: #000; }

        /* utility */
        .center { text-align: center; }

        /* meta header (compact, no borders) */
        table.meta-row { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        table.meta-row td, table.meta-row th { border: none !important; padding: 2px 6px !important; vertical-align: middle !important; text-align: left !important; line-height: 1; }
        .meta-left .meta-sub { margin-top: 4px; display: block; }
        .meta-left { width: 65%; }
        .meta-right { width: 23%; text-align: right; }

        /* main tables */
        table { width: 100%; border-collapse: collapse; margin-top: 0; }
        th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; word-break: break-word; }
    th { text-align: center; font-weight: bold; }
    thead th { background: #f2f2f2; }
        td { text-align: center; height: 24px; font-size: 11px; }

        /* column widths */
        td.description { text-align: left; padding-left: 8px; line-height: 1.35; }
        .qty { width: 6%; } .unit { width: 8%; } .unit-cost { width: 11%; } .total-cost { width: 11%; }
        .description { width: 38%; } .item-no { width: 13%; } .useful-life { width: 13%; }

        /* signatures */
        .signatures { width: 100%; margin-top: 8px; display: table; }
        .sig-block { display: table-cell; width: 50%; padding: 0 10px; vertical-align: top; }
        .sig-block:first-child { border-right: 1px solid #000; padding-right: 15px; }
        .sig-block:last-child { padding-left: 15px; }
        .sig-label { text-align: left; font-weight: bold; margin-bottom: 35px; font-size: 11px; }
        .sig-line { width: 100%; border-bottom: 1px solid #000; margin-bottom: 3px; }
        .sig-name { font-weight: bold; font-size: 11px; text-align: center; margin-bottom: 2px; }
        .sig-subtext { font-size: 10px; line-height: 1.4; text-align: center; color: #c00; }
        .sig-subtext.position { color: #000; }
    </style>
</head>
<body>
    <div class="header">
        <div style="float:right;"><strong><em>Appendix 59</em></strong></div>
        <div style="clear:both"></div>
    </div>

    <h2 class="center" style="margin:2px 0 6px 0;">INVENTORY CUSTODIAN SLIP</h2>

    <!-- single compact meta row: left = stacked labels, right = ICS aligned to item-no column -->
    <table class="meta-row" style="margin-bottom:8px;">
        <tr>
            <td class="meta-left">
                <div><strong>Entity Name :</strong> <?php echo e($entityName ?? '____________________________________'); ?></div>
                <div class="meta-sub"><strong>Fund Cluster :</strong> <?php echo e($fundCluster ?? '____________________________________'); ?></div>
            </td>
            <td class="meta-right"><strong>ICS No. :</strong> <?php echo e($parNo ?? '_______________'); ?></td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th rowspan="2" class="qty">Quantity</th>
                <th rowspan="2" class="unit">Unit</th>
                <th colspan="2">Amount</th>
                <th rowspan="2" class="description">Description</th>
                <th rowspan="2" class="item-no">Inventory Item No.</th>
                <th rowspan="2" class="useful-life">Estimated Useful Life</th>
            </tr>
            <tr>
                <th class="unit-cost">Unit Cost</th>
                <th class="total-cost">Total Cost</th>
            </tr>
        </thead>
        <tbody>
            <?php
                $renderItems = $items ?? [];
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
        </tbody>
        <tfoot>
            <tr>
                <td colspan="7" style="padding: 12px 6px;">
                    <div class="signatures">
                        <div class="sig-block">
                            <div class="sig-label">Received from :</div>
                            <div class="sig-line"></div>
                            <div class="sig-name">ARSENIO GEM A. GARCILLANOSA</div>
                            <div class="sig-subtext">Signature Over Printed Name</div>
                            <div class="sig-subtext position">Supply Officer III/Admin Officer V</div>
                            <div class="sig-subtext position">Date: _________________</div>
                        </div>

                        <div class="sig-block">
                            <div class="sig-label">Received by:</div>
                            <div class="sig-line"></div>
                            <div class="sig-name">_______________________________</div>
                            <div class="sig-subtext">Signature Over Printed Name</div>
                            <div class="sig-subtext position">Position: _________________</div>
                            <div class="sig-subtext position">Date: _________________</div>
                        </div>
                    </div>
                </td>
            </tr>
        </tfoot>
    </table>
</body>
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/inventory_custodian_slip_pdf.blade.php ENDPATH**/ ?>