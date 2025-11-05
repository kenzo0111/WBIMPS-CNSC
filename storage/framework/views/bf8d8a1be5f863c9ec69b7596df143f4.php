<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title>Edit RIS - <?php echo e($ris->ris_no); ?></title>
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
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #15803d 0%, #166534 100%);
            color: white;
            padding: 30px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .btn-group {
            display: flex;
            gap: 12px;
        }

        .btn {
            padding: 10px 20px;
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
            background: white;
            color: #15803d;
        }

        .btn-primary:hover {
            background: #f0fdf4;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid white;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }

        .content {
            padding: 40px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #15803d;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-label {
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
        }

        .form-input {
            padding: 12px 14px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s ease;
            background: white;
        }

        .form-input:focus {
            outline: none;
            border-color: #15803d;
            box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
        }

        .form-input:disabled {
            background: #f8fafc;
            color: #64748b;
            cursor: not-allowed;
        }

        .items-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }

        .items-table th {
            background: #15803d;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
        }

        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }

        .items-table tr:last-child td {
            border-bottom: none;
        }

        .items-table tr:hover {
            background: #f8fafc;
        }

        .signature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin-bottom: 30px;
        }

        .signature-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
        }

        .actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
        }

        .btn-save {
            background: #15803d;
            color: white;
            padding: 12px 30px;
        }

        .btn-save:hover {
            background: #166534;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
        }

        .btn-cancel {
            background: #64748b;
            color: white;
            padding: 12px 30px;
        }

        .btn-cancel:hover {
            background: #475569;
        }

        .readonly-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #fef3c7;
            color: #92400e;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>Requisition & Issue Slip</h1>
                <p><?php echo e($ris->ris_no); ?></p>
            </div>
            <div class="btn-group">
                <a href="/requisition-issue-slip/view/<?php echo e($ris->id); ?>" target="_blank" class="btn btn-primary">
                    📄 View PDF
                </a>
                <a href="/admin/dashboard" class="btn btn-secondary">
                    ← Back to Dashboard
                </a>
            </div>
        </div>

        <form id="risForm" action="/requisition-issue-slip/<?php echo e($ris->id); ?>" method="POST">
            <?php echo csrf_field(); ?>
            <?php echo method_field('PUT'); ?>
            
            <div class="content">
                <!-- Basic Information -->
                <h3 class="section-title">📋 Basic Information</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">RIS No.</label>
                        <input type="text" name="ris_no" class="form-input" value="<?php echo e($ris->ris_no); ?>" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Entity Name</label>
                        <input type="text" name="entity_name" class="form-input" value="<?php echo e($ris->entity_name); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fund Cluster</label>
                        <input type="text" name="fund_cluster" class="form-input" value="<?php echo e($ris->fund_cluster); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Division</label>
                        <input type="text" name="division" class="form-input" value="<?php echo e($ris->division); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Office</label>
                        <input type="text" name="office" class="form-input" value="<?php echo e($ris->office); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Responsibility Center Code</label>
                        <input type="text" name="responsibility_center_code" class="form-input" value="<?php echo e($ris->responsibility_center_code); ?>">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 30px;">
                    <label class="form-label">Purpose</label>
                    <textarea name="purpose" class="form-input" rows="3"><?php echo e($ris->purpose); ?></textarea>
                </div>

                <!-- Items -->
                <h3 class="section-title">📦 Items</h3>
                <div class="items-section">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Stock No.</th>
                                <th>Unit</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Stock Available</th>
                                <th>Issue Qty</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if(isset($ris->items) && is_array($ris->items)): ?>
                                <?php $__currentLoopData = $ris->items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <tr>
                                    <td><?php echo e($item['stock_no'] ?? ''); ?></td>
                                    <td><?php echo e($item['unit'] ?? ''); ?></td>
                                    <td><?php echo e($item['description'] ?? ''); ?></td>
                                    <td><?php echo e($item['quantity'] ?? ''); ?></td>
                                    <td><?php echo e($item['stock_available'] ?? ''); ?></td>
                                    <td><?php echo e($item['issue_quantity'] ?? ''); ?></td>
                                    <td><?php echo e($item['remarks'] ?? ''); ?></td>
                                </tr>
                                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">
                                        No items available
                                    </td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Signatures -->
                <h3 class="section-title">✍️ Signatures</h3>
                <div class="signature-grid">
                    <!-- Requested By -->
                    <div class="signature-card">
                        <h4 style="margin-bottom: 15px; color: #15803d; font-size: 15px;">Requested By</h4>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Name</label>
                            <input type="text" name="requested_by_name" class="form-input" value="<?php echo e($ris->requested_by_name); ?>">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Designation</label>
                            <input type="text" name="requested_by_designation" class="form-input" value="<?php echo e($ris->requested_by_designation); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" name="requested_by_date" class="form-input" value="<?php echo e($ris->requested_by_date ? $ris->requested_by_date->format('Y-m-d') : ''); ?>">
                        </div>
                    </div>

                    <!-- Approved By -->
                    <div class="signature-card">
                        <h4 style="margin-bottom: 15px; color: #15803d; font-size: 15px;">Approved By</h4>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Name</label>
                            <input type="text" name="approved_by_name" class="form-input" value="<?php echo e($ris->approved_by_name); ?>">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Designation</label>
                            <input type="text" name="approved_by_designation" class="form-input" value="<?php echo e($ris->approved_by_designation); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" name="approved_by_date" class="form-input" value="<?php echo e($ris->approved_by_date ? $ris->approved_by_date->format('Y-m-d') : ''); ?>">
                        </div>
                    </div>

                    <!-- Issued By -->
                    <div class="signature-card">
                        <h4 style="margin-bottom: 15px; color: #15803d; font-size: 15px;">Issued By</h4>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Name</label>
                            <input type="text" name="issued_by_name" class="form-input" value="<?php echo e($ris->issued_by_name); ?>">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Designation</label>
                            <input type="text" name="issued_by_designation" class="form-input" value="<?php echo e($ris->issued_by_designation); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" name="issued_by_date" class="form-input" value="<?php echo e($ris->issued_by_date ? $ris->issued_by_date->format('Y-m-d') : ''); ?>">
                        </div>
                    </div>

                    <!-- Received By -->
                    <div class="signature-card">
                        <h4 style="margin-bottom: 15px; color: #15803d; font-size: 15px;">Received By</h4>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Name</label>
                            <input type="text" name="received_by_name" class="form-input" value="<?php echo e($ris->received_by_name); ?>">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Designation</label>
                            <input type="text" name="received_by_designation" class="form-input" value="<?php echo e($ris->received_by_designation); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" name="received_by_date" class="form-input" value="<?php echo e($ris->received_by_date ? $ris->received_by_date->format('Y-m-d') : ''); ?>">
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="actions">
                    <button type="button" class="btn btn-cancel" onclick="window.location.href='/admin/dashboard'">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-save">
                        💾 Save Changes
                    </button>
                </div>
            </div>
        </form>
    </div>

    <script>
        // Form submission handling
        document.getElementById('risForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch(this.action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('RIS updated successfully!');
                    window.location.href = '/admin/dashboard';
                } else {
                    const error = await response.json();
                    alert('Error updating RIS: ' + (error.message || 'Unknown error'));
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    </script>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/ris/edit.blade.php ENDPATH**/ ?>