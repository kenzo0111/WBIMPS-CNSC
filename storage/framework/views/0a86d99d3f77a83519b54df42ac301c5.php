<?php
/**
 * Simple view that displays open links for document types based on the
 * provided $selectedForms array from the controller. If $selectedForms is
 * null, display all available links.
 */
$allForms = [
    'PO' => ['label' => 'Purchase Order (PO)', 'route' => url('/purchase-order/view/' . $requestId)],
    'PR' => ['label' => 'Purchase Request (PR)', 'route' => url('/purchase-request/view/' . $requestId)],
    'ICS' => ['label' => 'Inventory Custodian Slip (ICS)', 'route' => url('/inventory-custodian-slip/view/' . $requestId)],
    'RIS' => ['label' => 'Requisition & Issue Slip (RIS)', 'route' => url('/requisition-issue-slip/view/' . $requestId)],
    'PAR' => ['label' => 'Property Acknowledgement Receipt (PAR)', 'route' => url('/property-acknowledgement-receipt/view/' . $requestId)],
    'IAR' => ['label' => 'Inspection & Acceptance Report (IAR)', 'route' => url('/inspection-acceptance-report/view/' . $requestId)],
];
$showAll = $selectedForms === null;
?>

<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>View Request <?php echo e($requestId); ?></title>
    <style>
        body{font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;padding:24px}
        .chooser{display:flex;flex-direction:column;gap:8px;max-width:520px}
        .link{display:block;padding:10px 12px;border-radius:8px;border:1px solid #e5e7eb;text-decoration:none;color:#0f172a;background:#fff}
    </style>
</head>
<body>
    <h2>Request <?php echo e($requestId); ?></h2>
    <p>Select a document to open (only forms originally checked will be shown).</p>

    <div class="chooser">
        <?php $__currentLoopData = $allForms; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $code => $meta): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php if($showAll || ($selectedForms && in_array($code, $selectedForms))): ?>
                <a class="link" href="<?php echo e($meta['route']); ?>" target="_blank" rel="noopener"><?php echo e($meta['label']); ?></a>
            <?php endif; ?>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/requests/view.blade.php ENDPATH**/ ?>