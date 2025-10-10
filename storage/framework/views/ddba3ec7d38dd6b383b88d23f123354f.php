<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Purchase Order - <?php echo e($po_number ?? 'PO'); ?></title>
    <style>
        @page { size: A4 portrait; margin: 16mm 14mm 18mm 14mm; }
        html, body { height:100%; }
        body{margin:0;font-family:'Times New Roman',Times,serif;font-size:10px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        .purchase-order-doc{background:#fff;padding:14px 16px;box-sizing:border-box;position:relative}
    .annex-label{position:absolute;top:8px;right:12px;font-size:12px;font-weight:700;color:#000;}
        table{border-collapse:collapse;width:100%;}
        td{vertical-align:top;padding:4px}
        .table-cell-border{border-right:1px solid #000;border-top:1px solid #000;}
        .table-cell-border-right{border-right:1px solid #000;}
        .table-cell-border-top{border-top:1px solid #000;}
        .table-border-2{border:2px solid #000;}
        .text-center{text-align:center;}
        .font-semibold{font-weight:600;}
        .font-bold{font-weight:700;}
        .h-8{height:1.5rem;}
        @media print{ body{margin:0;} }
    </style>
</head>
<body>
    <div class="purchase-order-container">
        <div class="purchase-order-doc">
            <div style="text-align:center;margin-bottom:16px;">
                <div class="annex-label">Appendix 6.1</div>
                <h1 style="font-size:14px;font-weight:700;margin:0 0 6px;">PURCHASE ORDER</h1>
                <p style="font-size:12px;text-decoration:underline;margin:0 0 3px;"><?php echo e($entity_name ?? 'Camarines Norte State College'); ?></p>
                <p style="font-size:10px;font-style:italic;margin:0;color:#444"><?php echo e($entity_address ?? 'lot 8, F. Pimentel'); ?></p>
            </div>

            <div class="table-border-2" style="border:2px solid #000;">
                <table style="font-size:11px;">
                    <tbody>
                        <tr>
                            <td class="table-cell-border-right font-semibold" style="width:15%">Supplier:</td>
                            <td colspan="3" class="table-cell-border-right" style="width:45%"><?php echo e($supplier ?? ''); ?></td>
                            <td class="table-cell-border-right font-semibold" style="width:15%">P.O. No.:</td>
                            <td style="width:25%"><?php echo e($po_number ?? ''); ?></td>
                        </tr>

                        <tr>
                            <td class="table-cell-border font-semibold">Address:</td>
                            <td colspan="3" class="table-cell-border-right table-cell-border-top"><?php echo e($supplier_address ?? ''); ?></td>
                            <td class="table-cell-border-right table-cell-border-top font-semibold">Date:</td>
                            <td class="table-cell-border-top"><?php echo e(isset($date_of_purchase) ? 
                                
                                
                                
                                \Carbon\Carbon::parse($date_of_purchase)->format('F d, Y') : ''); ?></td>
                        </tr>

                        <tr>
                            <td class="table-cell-border font-semibold">TIN:</td>
                            <td colspan="3" class="table-cell-border-right table-cell-border-top"><?php echo e($tin_number ?? ''); ?></td>
                            <td class="table-cell-border-right table-cell-border-top font-semibold">Mode of Procurement:</td>
                            <td class="table-cell-border-top"><?php echo e($mode_of_procurement ?? $mode_of_payment ?? ''); ?></td>
                        </tr>

                        <tr>
                            <td colspan="6" class="table-cell-border-top" style="padding:12px;"><strong style="font-size:12px;">Gentlemen:</strong><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Please furnish this Office the following articles subject to the terms and conditions contained herein:</td>
                        </tr>

                        <tr>
                            <td class="table-cell-border font-semibold">Place of Delivery:</td>
                            <td colspan="2" class="table-cell-border-right table-cell-border-top"><?php echo e($place_of_delivery ?? ''); ?></td>
                            <td class="table-cell-border-right table-cell-border-top font-semibold">Delivery Term:</td>
                            <td colspan="2" class="table-cell-border-top"><?php echo e($delivery_term ?? ''); ?></td>
                        </tr>

                        <tr>
                            <td class="table-cell-border font-semibold">Date of Delivery:</td>
                            <td colspan="2" class="table-cell-border-right table-cell-border-top"><?php echo e(isset($date_of_delivery) ? \Carbon\Carbon::parse($date_of_delivery)->format('F d, Y') : ''); ?></td>
                            <td class="table-cell-border-right table-cell-border-top font-semibold">Payment Term:</td>
                            <td colspan="2" class="table-cell-border-top"><?php echo e($payment_term ?? ''); ?></td>
                        </tr>

                        <tr>
                            <td class="table-cell-border text-center font-semibold" style="width:13%">Stock/Property Number</td>
                            <td class="table-cell-border text-center font-semibold" style="width:8%">Unit</td>
                            <td class="table-cell-border text-center font-semibold" style="width:39%">Description</td>
                            <td class="table-cell-border text-center font-semibold" style="width:10%">Quantity</td>
                            <td class="table-cell-border text-center font-semibold" style="width:15%">Unit Cost</td>
                            <td class="table-cell-border-top text-center font-semibold" style="width:15%">Amount</td>
                        </tr>

                        <?php $__empty_1 = true; $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                            <tr>
                                <td class="table-cell-border"><?php echo e($item['stock_number'] ?? ''); ?></td>
                                <td class="table-cell-border"><?php echo e($item['unit'] ?? ''); ?></td>
                                <td class="table-cell-border"><?php echo e($item['description'] ?? ''); ?></td>
                                <td class="table-cell-border text-center"><?php echo e(number_format($item['quantity'] ?? 0, 2)); ?></td>
                                <td class="table-cell-border text-right"><?php echo e(number_format($item['unit_cost'] ?? 0, 2)); ?></td>
                                <td class="table-cell-border text-right"><?php echo e(number_format($item['amount'] ?? 0, 2)); ?></td>
                            </tr>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                            <tr>
                                <td colspan="6" class="table-cell-border text-center">No items</td>
                            </tr>
                        <?php endif; ?>

                        <tr>
                            <td colspan="5" class="table-cell-border text-right font-semibold">Grand Total:</td>
                            <td class="table-cell-border-top text-right font-bold"><?php echo e(number_format($grand_total ?? 0, 2)); ?></td>
                        </tr>


                        <tr>
                            <td colspan="3" class="table-cell-border text-center" style="padding:16px;height:160px;vertical-align:top;">
                                <p style="margin-bottom:8px;font-style:italic;font-size:10px;">In case of failure to make the total delivery within the time specified above, a penalty of one percent (1%) of the total contract price shall be imposed for each day of delay, until the obligation is fully complied with.</p>
                                <p style="margin-bottom:8px;font-style:italic;font-size:10px;">Conforme:</p>
                                <div style="width:192px;margin:0 auto 8px;height:48px;border-bottom:2px solid #000;"></div>
                                <p style="font-size:10px;font-style:italic;">signature over printed name of supplier</p>
                                <div style="margin-top:12px;display:flex;align-items:center;justify-content:center;"><span style="font-size:10px;margin-right:8px;">Date:</span><span style="border-bottom:1px solid black;display:inline-block;width:80px;padding-bottom:2px;"></span></div>
                            </td>
                            <td colspan="3" class="table-cell-border-top text-center" style="padding:16px;height:160px;vertical-align:top;">
                                <div style="text-align:center;margin-top:48px;">
                                    <p style="margin-bottom:8px;font-style:italic;font-size:10px;">Very truly yours,</p>
                                    <div style="width:192px;margin:0 auto 8px;height:48px;border-bottom:2px solid #000;"></div>
                                    <p style="font-size:10px;font-style:italic;">signature over printed name of authorization</p>
                                    <p style="font-size:10px;font-style:italic;">College President</p>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td class="table-cell-border font-semibold" style="width:15%">Fund Cluster:</td>
                            <td class="table-cell-border-right table-cell-border-top" style="width:35%"><?php echo e($fund_cluster ?? ''); ?></td>
                            <td class="table-cell-border font-semibold" style="width:15%">ORS/BURS No.:</td>
                            <td colspan="3" class="table-cell-border-top"><?php echo e($ors_burs_no ?? ''); ?></td>
                        </tr>

                        <tr>
                            <td class="table-cell-border font-semibold">Funds Available:</td>
                            <td class="table-cell-border-right table-cell-border-top"><?php echo e($funds_available ?? ''); ?></td>
                            <td class="table-cell-border font-semibold text-left">Date of ORS/BURS:</td>
                            <td class="table-cell-border"><?php echo e(isset($ors_burs_date) ? \Carbon\Carbon::parse($ors_burs_date)->format('F d, Y') : ''); ?></td>
                            <td class="table-cell-border font-semibold text-center">Amount:</td>
                            <td class="table-cell-border-top"><?php echo e($ors_burs_amount ?? ''); ?></td>
                        </tr>

                        <tr>
                            <td colspan="6" class="table-cell-border-top text-center" style="padding:16px;height:80px;vertical-align:bottom;">
                                <div style="height:48px;border-bottom:2px solid #000;margin:0 auto 4px;width:192px;display:flex;align-items:flex-end;justify-content:center;font-size:10px;"><?php echo e($accountant_signature ?? ''); ?></div>
                                <p style="font-size:10px;font-weight:700;margin:4px 0 0;">Accountant's Signature</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/purchase_order_pdf.blade.php ENDPATH**/ ?>