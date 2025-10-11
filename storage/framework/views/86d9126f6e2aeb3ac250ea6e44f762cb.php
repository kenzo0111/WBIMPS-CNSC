<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inspection and Acceptance Report</title>
    <style>
        @page { margin: 18pt; }
        html, body { height: 100%; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.25;
            color: #000;
            margin: 0;
            padding: 18pt;
        }

        /* Header / Title */
        .header-title { text-align: right; font-style: italic; font-size: 9pt; margin-bottom: 6px; }
        .main-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 10px; }

    /* Info table */
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    .info-table.compact { margin-bottom: 2px; }
    .info-table td { padding: 2px 6px; font-size: 9.5pt; vertical-align: bottom; }
    .info-table .label { width: 14%; font-weight: normal; padding-right:4px; }
    .info-table .field { border-bottom: 1px solid #000; padding-bottom:2px; }

        /* Items table */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; table-layout: fixed; }
        .items-table thead td { border: none; padding: 4px 6px; font-size: 9pt; }
        .items-table thead tr + tr td { border-top: none; }
        .items-table, .items-table th, .items-table td { border: 1px solid #000; }
        .items-table th, .items-table td { padding: 6px; font-size: 10pt; }
    .items-table th { background: transparent; font-weight: bold; text-align: center; }

    /* Column widths (percentage-based for consistency) */
        .stock-col { width: 12%; text-align: center; }
    .description-col { width: 52%; text-align: left; padding-left: 8px; }
        .unit-col { width: 12%; text-align: right; }
        .quantity-col { width: 12%; text-align: right; }

    /* Keep the description header left-aligned while other headers are centered */
    .items-table th.description-col { text-align: left; padding-left: 8px; }

        /* Ensure rows have consistent height for better PDF rendering */
        .items-table tbody td { height: 26px; }

        /* Footer (inspection / acceptance) inside items table */
        .items-table tfoot { border-collapse: collapse; margin-top: 6px; }
        .items-table tfoot td { border: 1px solid #000; padding: 10px 12px; vertical-align: top; min-height: 140px; }
        .inspection-section, .acceptance-section { /* kept for inner structure, no extra borders */ padding: 0; margin: 0; border: 0; display:flex; flex-direction:column; justify-content:space-between; }
        .signature-block { text-align:center; margin-top:8px; }
        .section-title { font-weight: bold; text-align: center; margin-bottom: 6px; }

        .date-field { margin-bottom: 8px; font-size: 10pt; }
        .checkbox-group { margin-bottom: 6px; font-size: 10pt; }
        .checkbox { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; margin-right: 6px; vertical-align: middle; }
        .checkbox.checked::before { content: '\2713'; display: block; text-align: center; line-height: 14px; font-size: 12px; }

        .signature-block { margin-top: auto; text-align: center; }
        .signature-line { display: inline-block; width: 70%; border-top: 1px solid #000; padding-top: 6px; margin-top: 18px; font-size: 10pt; }

        /* Small print adjustments for tight PDF space */
        .small { font-size: 9pt; }
        .muted { color: #333; }
    /* Signature row styles */
    .signature-row { width: 100%; display: flex; gap: 16px; margin-top: 10px; }
    .signature-cell { flex: 1; text-align: center; }
    .signature-cell .signature-line { display: inline-block; width: 80%; }
    </style>
</head>
<body>
    <div class="header-title"><?php echo e($appendixTitle ?? 'Appendix 69'); ?></div>

    <div class="main-title">INSPECTION AND ACCEPTANCE REPORT</div>

    <!-- Info row: uses a 4-column grid so right side aligns with IAR No (which occupies cols 3-4 in the items table) -->
    <table class="info-table compact">
        <colgroup>
            <col style="width:12%">
            <col style="width:52%">
            <col style="width:12%">
            <col style="width:12%">
        </colgroup>
        <tr>
            <td class="label">Entity Name :</td>
            <td class="field"><?php echo e($entityName ?? ''); ?></td>
            <td class="label">Fund Cluster :</td>
            <td class="field"><?php echo e($fundCluster ?? ''); ?></td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <td colspan="2" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">Supplier : <?php echo e($supplier ?? ''); ?></td>
                <td colspan="2" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">IAR No. : <?php echo e($iarNo ?? ''); ?></td>
            </tr>
            <tr>
                <td colspan="2" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">PO No./Date : <?php echo e($poNo ?? ''); ?> <?php echo e(isset($poDate) ? '/ ' . $poDate : ''); ?></td>
                <td colspan="2" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">Date. : <?php echo e($iarDate ?? ''); ?></td>
            </tr>
            <tr>
                <td colspan="2" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">Requisitioning Office/Dep : <?php echo e($requisitionOffice ?? ''); ?></td>
                <td colspan="2" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">Invoice No : <?php echo e($invoiceNo ?? ''); ?></td>
            </tr>
            <tr>
                <td colspan="2" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;"> Responsibility Center Code : <?php echo e($responsibilityCenterCode ?? ''); ?></td>
                <td colspan="2" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">Date. : <?php echo e($responsibilityDate ?? ''); ?></td>
            </tr>
            <tr>
                <th class="stock-col">Stock/<br>Property No.</th>
                <th class="description-col">Description</th>
                <th class="unit-col">Unit</th>
                <th class="quantity-col">Quantity</th>
            </tr>
        </thead>
        <tbody>
            <?php if(isset($items) && count($items) > 0): ?>
                <?php $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <tr>
                    <td class="stock-col"><?php echo e($item['stock_no'] ?? ''); ?></td>
                    <td class="description-col"><?php echo e($item['description'] ?? ''); ?></td>
                    <td class="unit-col"><?php echo e($item['unit'] ?? ''); ?></td>
                    <td class="quantity-col"><?php echo e($item['quantity'] ?? ''); ?></td>
                </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                <?php for($i = count($items); $i < 8; $i++): ?>
                <tr>
                    <td class="stock-col">&nbsp;</td>
                    <td class="description-col">&nbsp;</td>
                    <td class="unit-col">&nbsp;</td>
                    <td class="quantity-col">&nbsp;</td>
                </tr>
                <?php endfor; ?>
            <?php else: ?>
                <?php for($i = 0; $i < 8; $i++): ?>
                <tr>
                    <td class="stock-col">&nbsp;</td>
                    <td class="description-col">&nbsp;</td>
                    <td class="unit-col">&nbsp;</td>
                    <td class="quantity-col">&nbsp;</td>
                </tr>
                <?php endfor; ?>
            <?php endif; ?>
        </tbody>

        <tfoot>
            <tr>
                <td colspan="2" style="vertical-align: top;">
                    <div class="inspection-section">
                        <div class="section-title">INSPECTION</div>
                        <div class="date-field">
                            <strong>Date Inspected :</strong> <?php echo e($dateInspected ?? ''); ?>

                        </div>
                        <div class="checkbox-group">
                            <span class="checkbox <?php echo e((isset($inspectionStatus) && $inspectionStatus == 'verified') ? 'checked' : ''); ?>"></span>
                            <span>Inspected, verified and found in order as to quantity and specifications</span>
                        </div>
                        <div class="signature-block">
                            <div class="signature-line"><?php echo e($inspectionOfficerLabel ?? ''); ?></div>
                        </div>
                    </div>
                </td>
                <td colspan="2" style="vertical-align: top;">
                    <div class="acceptance-section">
                        <div class="section-title">ACCEPTANCE</div>
                        <div class="date-field">
                            <strong>Date Received :</strong> <?php echo e($dateReceived ?? ''); ?>

                        </div>
                        <div class="checkbox-group">
                            <span class="checkbox <?php echo e((isset($acceptanceStatus) && $acceptanceStatus == 'complete') ? 'checked' : ''); ?>"></span>
                            <span>Complete</span>
                        </div>
                        <div class="checkbox-group">
                            <span class="checkbox <?php echo e((isset($acceptanceStatus) && $acceptanceStatus == 'partial') ? 'checked' : ''); ?>"></span>
                            <span>Partial (pls. specify quantity)</span>
                        </div>
                        <div class="signature-block">
                            <div class="signature-line"><?php echo e($custodianLabel ?? ''); ?></div>
                        </div>
                    </div>
                </td>
            </tr>
        </tfoot>

    </table>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/inspection_acceptance_report_pdf.blade.php ENDPATH**/ ?>