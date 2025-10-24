<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
    body { font-family: "Times New Roman", Times, serif; font-size: 11px; margin: 10px; }
        .title { text-align: center; font-weight: bold; margin-bottom: 6px; }
        .sub-title { text-align: center; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 6px; }
        thead th { background: #fff; }
        .no-border td { border: none; padding: 2px; }
        .right { text-align: right; }
        .center { text-align: center; }
    .small { font-family: "Times New Roman", Times, serif; font-size: 10px; }
        .purpose { border: 1px solid #000; padding: 6px; min-height: 40px; }
        .signature { padding-top: 30px; }
    </style>
</head>
<body>
    <style>
        /* appendix positioning */
        .appendix {
            position: absolute;
            right: 18px;
            top: <?php echo e($appendix_top ?? '1px'); ?>;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="flex:1"></div>
        <div style="text-align:center; flex:2"><span class="title">PURCHASE REQUEST</span></div>
        <div style="flex:1"></div>
    </div>
    <div class="appendix"><?php echo e($appendix ?? 'Appendix 60'); ?></div>

    <table class="no-border" style="margin-bottom:6px; width:100%;">
        <tr>
            <td style="width:12%;"><strong>Entity Name:</strong> <?php echo e($entity_name); ?></td>
            <td style="width:8%;"></td>
            <td style="width:40%;"></td>
            <td style="width:8%;"></td>
            <td style="width:16%; text-align:left;"><strong>Fund Cluster:</strong> <?php echo e($fund_cluster ?? ''); ?></td>
            <td style="width:16%;"></td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th colspan="2" style="width:33%"></th>
                <th colspan="2" style="width:34%; text-align:left;">
                    <div><strong>PR No.:</strong> <?php echo e($pr_no); ?></div>
                    <div style="margin-top:4px;"><strong>Responsibility Center Code:</strong> <?php echo e($responsibility_center_code ?? ''); ?></div>
                </th>
                <th colspan="2" style="width:33%; text-align:left;"><strong>Date:</strong> <?php echo e($date ?? ''); ?></th>
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
            
            <?php $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <tr>
                <td class="center"><?php echo e($item['stock_no'] ?? ($index + 1)); ?></td>
                <td class="center"><?php echo e($item['unit'] ?? ''); ?></td>
                <td><?php echo e($item['item_description']); ?></td>
                <td class="center"><?php echo e($item['quantity']); ?></td>
                <td class="right"><?php echo e(number_format($item['unit_cost'] ?? 0, 2)); ?></td>
                <td class="right"><?php echo e(number_format($item['total_cost'] ?? 0, 2)); ?></td>
            </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

            
            <?php
                $filled = count($items);
                $rowsToAdd = max(0, 25 - $filled);
            ?>
            <?php for($i = 0; $i < $rowsToAdd; $i++): ?>
            <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
            </tr>
            <?php endfor; ?>

            <tr>
                <td colspan="5" class="right"><strong>TOTAL</strong></td>
                <td class="right"><strong><?php echo e(number_format(collect($items)->sum(function($it){ return $it['total_cost'] ?? 0; }), 2)); ?></strong></td>
            </tr>

            
            <tr>
                <td colspan="6" style="vertical-align:top;"><strong>Purpose:</strong></td>
            </tr>
            <tr>
                <td colspan="6" class="purpose"><?php echo e($purpose); ?></td>
            </tr>
            <tr>
                <td colspan="3" style="text-align:center; padding-top:18px;">
                    Requested by:<br>
                    <table style="width:100%; border:none; border-collapse:collapse;">
                        <tr>
                            <td style="text-align:center; border:none; padding:6px 2px 2px 2px;">
                                <div style="display:inline-block; width:80%; border-bottom:1px solid #000; height:12px;"></div>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align:center; border:none; padding:6px 2px 2px 2px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center; border:none; padding:2px;"><strong><?php echo e($requested_by); ?></strong></td>
                        </tr>
                        <tr>
                            <td style="text-align:center; border:none; padding:2px;" class="small"><?php echo e($designation); ?></td>
                        </tr>
                    </table>
                </td>
                <td colspan="3" style="text-align:center; padding-top:18px;">
                    Approved by:<br>
                    <table style="width:100%; border:none; border-collapse:collapse;">
                        <tr>
                            <td style="text-align:center; border:none; padding:6px 2px 2px 2px;">
                                <div style="display:inline-block; width:80%; border-bottom:1px solid #000; height:12px;"></div>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align:center; border:none; padding:6px 2px 2px 2px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align:center; border:none; padding:2px;"><strong><?php echo e($approved_by); ?></strong></td>
                        </tr>
                        <tr>
                            <td style="text-align:center; border:none; padding:2px;" class="small"><?php echo e($approved_position); ?></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>

</body>
</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/purchase_request_pdf.blade.php ENDPATH**/ ?>