<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Requisition & Issue Slips</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 16px;
            padding: 30px 40px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #0f172a;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: #15803d;
            color: white;
        }

        .btn-primary:hover {
            background: #166534;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
        }

        .btn-secondary {
            background: #64748b;
            color: white;
        }

        .btn-secondary:hover {
            background: #475569;
        }

        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }

        .ris-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }

        .ris-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
            border-color: #15803d;
        }

        .ris-card-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
        }

        .ris-number {
            font-size: 20px;
            font-weight: 700;
            color: #15803d;
        }

        .status-badge {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-active {
            background: #dcfce7;
            color: #166534;
        }

        .status-completed {
            background: #dbeafe;
            color: #1e40af;
        }

        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .ris-info {
            margin-bottom: 16px;
        }

        .info-row {
            display: flex;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .info-label {
            font-weight: 600;
            color: #64748b;
            min-width: 100px;
        }

        .info-value {
            color: #0f172a;
            flex: 1;
        }

        .card-actions {
            display: flex;
            gap: 10px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px solid #e2e8f0;
        }

        .btn-sm {
            padding: 8px 16px;
            font-size: 13px;
        }

        .btn-view {
            background: #15803d;
            color: white;
            flex: 1;
        }

        .btn-view:hover {
            background: #166534;
        }

        .btn-pdf {
            background: #dc2626;
            color: white;
            flex: 1;
        }

        .btn-pdf:hover {
            background: #b91c1c;
        }

        .empty-state {
            background: white;
            border-radius: 16px;
            padding: 60px 40px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .empty-state h2 {
            font-size: 24px;
            color: #64748b;
            margin-bottom: 12px;
        }

        .empty-state p {
            color: #94a3b8;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>📋 Requisition & Issue Slips</h1>
                <p style="color: #64748b; margin-top: 8px;">Manage all RIS records</p>
            </div>
            <div style="display: flex; gap: 12px;">
                <a href="/admin/dashboard" class="btn btn-secondary">
                    ← Back to Dashboard
                </a>
            </div>
        </div>

        <?php if($risRecords && count($risRecords) > 0): ?>
            <div class="cards-grid">
                <?php $__currentLoopData = $risRecords; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $ris): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div class="ris-card">
                        <div class="ris-card-header">
                            <div class="ris-number"><?php echo e($ris->ris_no); ?></div>
                            <span class="status-badge status-<?php echo e(strtolower($ris->status ?? 'pending')); ?>">
                                <?php echo e($ris->status ?? 'Pending'); ?>

                            </span>
                        </div>

                        <div class="ris-info">
                            <div class="info-row">
                                <span class="info-label">Entity:</span>
                                <span class="info-value"><?php echo e($ris->entity_name ?? 'N/A'); ?></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Division:</span>
                                <span class="info-value"><?php echo e($ris->division ?? 'N/A'); ?></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Office:</span>
                                <span class="info-value"><?php echo e($ris->office ?? 'N/A'); ?></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Purpose:</span>
                                <span class="info-value"><?php echo e(Str::limit($ris->purpose ?? 'N/A', 50)); ?></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Items:</span>
                                <span class="info-value"><?php echo e(is_array($ris->items) ? count($ris->items) : 0); ?> item(s)</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Created:</span>
                                <span class="info-value"><?php echo e($ris->created_at->format('M d, Y h:i A')); ?></span>
                            </div>
                        </div>

                        <div class="card-actions">
                            <a href="/requisition-issue-slip/view/<?php echo e($ris->id); ?>" class="btn btn-view btn-sm">
                                📝 View/Edit
                            </a>
                            <a href="/requisition-issue-slip/view/<?php echo e($ris->id); ?>" target="_blank" onclick="event.preventDefault(); window.open('/requisition-issue-slip/preview?id=<?php echo e($ris->id); ?>', '_blank');" class="btn btn-pdf btn-sm">
                                📄 PDF
                            </a>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
        <?php else: ?>
            <div class="empty-state">
                <h2>No RIS Records Found</h2>
                <p>There are no Requisition & Issue Slips in the system yet.</p>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/ris/index.blade.php ENDPATH**/ ?>