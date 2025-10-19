<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Status Changed</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; }
    .card { border: 1px solid #e5e7eb; padding: 16px; border-radius: 6px; }
    .muted { color: #6b7280; }
  </style>
</head>
<body>
  <div class="card">
    <h2><?php echo e($modelName); ?> status updated</h2>
    <p class="muted">ID: <strong><?php echo e($modelId); ?></strong></p>
    <p>
      Status changed from <strong><?php echo e($oldStatus ?? 'N/A'); ?></strong>
      to <strong><?php echo e($newStatus); ?></strong>.
    </p>

    <?php if(!empty($notes)): ?>
      <p><strong>Notes:</strong><br><?php echo e($notes); ?></p>
    <?php endif; ?>

    <p class="muted">This is an automated message from the SupplySystem.</p>
  </div>
</body>
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/emails/status_changed.blade.php ENDPATH**/ ?>