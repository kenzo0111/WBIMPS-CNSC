<!doctype html>
<html lang="<?php echo e(app()->getLocale()); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
    <link rel="icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
    <title>Purchase Request Submitted</title>
    <style>
        /* Keep minimal styles for clients that support them; critical styles are inlined for compatibility */
        .preheader { display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
    </style>
    
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#333333;">
    <!-- Preheader text: appears in inbox preview -->
    <span class="preheader">Purchase request <?php echo e($pr->request_id); ?> has been submitted by <?php echo e($pr->requester); ?>.</span>

    <!-- Outer wrapper table for better email client support -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f6f6; padding:20px 0;">
        <tr>
            <td align="center">
                <!-- Centered card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e5e5e5;">
                    <tr>
                        <td style="background:<?php echo e($brandPrimary ?? '#800000'); ?>;padding:18px 20px;color:<?php echo e($brandText ?? '#ffffff'); ?>;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="vertical-align:middle;width:64px;">
                                        <!-- Logo: prefer embedded CID (inline) then a provided URL, otherwise asset() -->
                                        <?php
                                            $logoSrc = $logoCid ?? ($logoUrl ?? asset('images/UCN1.png'));
                                        ?>
                                        <img src="<?php echo e($logoSrc); ?>" alt="Supply System" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;" onerror="this.style.display='none'">
                                    </td>
                                    <td style="vertical-align:middle;padding-left:12px;">
                                        <div style="font-size:18px;font-weight:600;line-height:1;color:<?php echo e($brandText ?? '#ffffff'); ?>;">Web-Based Supply and Property Management System</div>
                                        <div style="font-size:12px;opacity:0.95;color:<?php echo e($brandText ?? '#ffffff'); ?>;">Purchase Request Notification</div>
                                    </td>
                                    <td style="text-align:right;vertical-align:middle;font-size:12px;color:<?php echo e($brandText ?? '#ffffff'); ?>;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:22px 24px;">
                            <h1 style="margin:0 0 8px 0;font-size:20px;color:#222;">Purchase Request Submitted</h1>
                            <p style="margin:0 0 14px 0;color:#666;font-size:14px;">This email confirms that we have received your purchase request. It is now being processed. You will be notified when it is approved or if more information is needed.</p>

                            <!-- Summary rows -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;">
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;width:180px;font-weight:600;color:#444;">Request ID</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($pr->request_id); ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Requester</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($pr->requester); ?> &lt;<?php echo e($pr->email); ?>&gt;</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Designation</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($pr->designation ?? '-'); ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Department</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($pr->department); ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Priority</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($pr->priority); ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Purpose</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($pr->purpose ?? '-'); ?></td>
                                </tr>
                                <?php if(isset($pr->quantity) || isset($pr->unit) || isset($pr->unit_cost)): ?>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Quantity</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e(isset($pr->quantity) && $pr->quantity !== null ? number_format($pr->quantity) : '-'); ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Unit</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($pr->unit ?? '-'); ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Unit Cost</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e(isset($pr->unit_cost) && is_numeric($pr->unit_cost) ? '₱' . number_format($pr->unit_cost, 2) : ($pr->unit_cost ?? '-')); ?></td>
                                </tr>
                                <?php endif; ?>
                                    <!-- Removed summary-level Quantity/Unit: quantities and units are shown per-item in the items table -->
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Needed Date</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">
                                        <?php
                                            try {
                                                $needed = isset($pr->needed_date) && $pr->needed_date
                                                    ? \Carbon\Carbon::parse($pr->needed_date)->locale(app()->getLocale())->isoFormat('LL')
                                                    : '-';
                                            } catch (\Throwable $e) {
                                                $needed = $pr->needed_date ?? '-';
                                            }
                                        ?>
                                        <?php echo e($needed); ?>

                                    </td>
                                </tr>
                                <?php if(!empty($pr->remarks)): ?>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Remarks</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($pr->remarks); ?></td>
                                </tr>
                                <?php endif; ?>
                            </table>

                            <!-- Items table -->
                            <h3 style="margin:18px 0 8px 0;font-size:16px;color:#222;">Requested Items</h3>
                            <!-- Items table: include unit cost and line total if available -->
                            <table role="table" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e9e9e9;font-size:14px;">
                                <thead>
                                    <tr>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;width:6%;background:#fafafa;">#</th>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;background:#fafafa;">Description</th>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;width:12%;background:#fafafa;">Qty</th>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;width:12%;background:#fafafa;">Unit</th>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;width:14%;background:#fafafa;">Unit Cost</th>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;width:14%;background:#fafafa;">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php 
                                        $itemsToDisplay = $batchItems ?? (array) $pr->items;
                                        if ($batchItems) {
                                            // For batch, items are per-row PurchaseRequest objects
                                            $itemsToDisplay = $batchItems->map(function ($itemPr) {
                                                return [
                                                    'item_description' => $itemPr->item_description,
                                                    'unit' => $itemPr->unit,
                                                    'quantity' => $itemPr->quantity,
                                                    'unit_cost' => $itemPr->unit_cost,
                                                    'total_cost' => $itemPr->total_cost,
                                                ];
                                            })->toArray();
                                        }
                                        $idx = 0; 
                                    ?>
                                    <?php $__currentLoopData = $itemsToDisplay; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <?php $idx++; ?>
                                        <tr>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;"><?php echo e($idx); ?></td>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">
                                                <?php if(is_array($item)): ?>
                                                    <?php echo e($item['description'] ?? $item['item_description'] ?? $item['name'] ?? json_encode($item)); ?>

                                                <?php else: ?>
                                                    <?php echo e($item); ?>

                                                <?php endif; ?>
                                            </td>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">
                                                <?php
                                                    // Per-item quantity fallback: prefer item-level values; otherwise use PR-level quantity.
                                                    if (is_array($item)) {
                                                        $rowQty = $item['quantity'] ?? $item['qty'] ?? $item['requested_qty'] ?? null;
                                                    } elseif (is_object($item)) {
                                                        $rowQty = $item->quantity ?? $item->qty ?? $item->requested_qty ?? null;
                                                    } else {
                                                        $rowQty = $pr->quantity ?? null;
                                                    }
                                                    $rowQtyDisplay = $rowQty !== null && $rowQty !== '' ? (is_numeric($rowQty) ? number_format($rowQty) : $rowQty) : '-';
                                                ?>
                                                <?php echo e($rowQtyDisplay); ?>

                                            </td>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">
                                                <?php
                                                    // Per-item unit fallback: prefer item-level values; otherwise use PR-level unit.
                                                    if (is_array($item)) {
                                                        $rowUnit = $item['unit'] ?? $item['unit_of_measure'] ?? $item['uom'] ?? null;
                                                    } elseif (is_object($item)) {
                                                        $rowUnit = $item->unit ?? $item->unit_of_measure ?? $item->uom ?? null;
                                                    } else {
                                                        $rowUnit = $pr->unit ?? null;
                                                    }
                                                    $rowUnitDisplay = $rowUnit ?? '-';
                                                ?>
                                                <?php echo e($rowUnitDisplay); ?>

                                            </td>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">
                                                <?php
                                                    // Per-item unit cost fallback: prefer item-level values; otherwise use PR-level unit_cost.
                                                    if (is_array($item)) {
                                                        $u = $item['unit_cost'] ?? $item['unitCost'] ?? $item['price'] ?? null;
                                                    } elseif (is_object($item)) {
                                                        $u = $item->unit_cost ?? $item->unitCost ?? $item->price ?? null;
                                                    } else {
                                                        $u = $pr->unit_cost ?? null;
                                                    }
                                                    $uDisplay = is_numeric($u) ? '₱' . number_format($u, 2) : ($u ?? '-');
                                                ?>
                                                <?php echo e($uDisplay); ?>

                                            </td>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">
                                                <?php
                                                    // Per-item total: prefer item-level total; otherwise compute from available quantity and unit cost (falling back to PR-level values).
                                                    if (is_array($item)) {
                                                        $rowQty = $item['quantity'] ?? $item['qty'] ?? $item['requested_qty'] ?? null;
                                                        $itemTotal = $item['total_cost'] ?? $item['totalCost'] ?? null;
                                                    } elseif (is_object($item)) {
                                                        $rowQty = $item->quantity ?? $item->qty ?? $item->requested_qty ?? null;
                                                        $itemTotal = $item->total_cost ?? $item->totalCost ?? null;
                                                    } else {
                                                        $rowQty = $pr->quantity ?? null;
                                                        $itemTotal = null;
                                                    }

                                                    // Try top-level unit cost if per-item unit cost is not available
                                                    $rowU = $u ?? ($pr->unit_cost ?? null);

                                                    if ($itemTotal === null && is_numeric($rowQty) && is_numeric($rowU)) {
                                                        $rowTotal = $rowQty * $rowU;
                                                    } else {
                                                        $rowTotal = $itemTotal;
                                                    }

                                                    $tDisplay = is_numeric($rowTotal) ? '₱' . number_format($rowTotal, 2) : ($rowTotal ?? '-');
                                                ?>
                                                <?php echo e($tDisplay); ?>

                                            </td>
                                        </tr>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                </tbody>
                            </table>
                            <?php if(isset($pr->total_cost) || isset($pr->unit_cost)): ?>
                                <p style="margin-top:12px;color:#666;font-size:13px;">Estimated total (if provided): <strong style="color:#333;"><?php echo e(isset($pr->total_cost) ? '₱' . number_format($pr->total_cost, 2) : (isset($pr->unit_cost) ? '₱' . number_format($pr->unit_cost, 2) : '-')); ?></strong></p>
                            <?php endif; ?>
                            <p style="margin-top:18px;color:#666;font-size:13px;">Reference: <strong style="color:#333;"><?php echo e($pr->request_id); ?></strong></p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 24px;background:#fafafa;border-top:1px solid #f0f0f0;">
                            <div style="font-size:13px;color:#333;margin-bottom:8px;">Regards,<br/><strong>Supply and Property Management Office</strong></div>
                            <div style="font-size:12px;color:#666;margin-bottom:8px;">This message was sent by the Supply System. If you believe you received this in error, please contact the administrator.</div>
                            <div style="font-size:11px;color:#999;line-height:1.3;">Confidentiality Notice: This e-mail and any attachments are intended solely for the use of the intended recipient(s) and may contain confidential information. If you are not the intended recipient, please notify the sender and delete this message.</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/emails/request_submitted.blade.php ENDPATH**/ ?>