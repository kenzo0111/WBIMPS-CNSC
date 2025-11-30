<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>" />
    <title>Purchase Request • SPMO</title>
    <?php echo app('Illuminate\Foundation\Vite')('resources/css/user-request.css'); ?>
    <?php echo app('Illuminate\Foundation\Vite')('resources/js/user-request.js'); ?>
    <link rel="shortcut icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
    <link rel="icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
</head>

<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <img src="<?php echo e($imagesPath); ?>/cnscrefine.png" alt="CNSC Logo" />
                <div class="logo-text">
                    <h1>Supply and Property Management</h1>
                    <hr />
                    <p>WEB-BASED SUPPLY AND PROPERTY MANAGEMENT SYSTEM</p>
                </div>
            </div>
        </div>
    </header>

    <main class="access-main">
        <div class="access-container">
            <div class="access-content">
                <div class="badge-small">Purchase Request Module</div>
                <form class="request-card" id="purchaseRequestForm">
                    <!-- Progress Bar -->
                    <div class="wizard-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-steps">
                            <div class="step active" data-step="1">
                                <span class="step-number">1</span>
                                <span class="step-label">Personal Info</span>
                            </div>
                            <div class="step" data-step="2">
                                <span class="step-number">2</span>
                                <span class="step-label">Details & Priority</span>
                            </div>
                            <div class="step" data-step="3">
                                <span class="step-number">3</span>
                                <span class="step-label">Review & Submit</span>
                            </div>
                        </div>
                    </div>

                    <div class="request-header">
                        <h2>Purchase Request</h2>
                        <div class="request-subtitle">Submit an item requisition for approval</div>
                    </div>

                    <!-- Step 1: Personal Information -->
                    <div class="wizard-step active" id="step1">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label" for="email">Email Address</label>
                                <input class="form-input" id="email" name="email" type="email"
                                    placeholder="your.email@cnsc.edu.ph" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="requester">Requester</label>
                                <input class="form-input" id="requester" name="requester" type="text"
                                    placeholder="Full name" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="department">Department</label>
                                <input class="form-input" id="department" name="department" type="text"
                                    placeholder="e.g., CCMS" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="entityName">Entity Name <small class="small">(optional)</small></label>
                                <input class="form-input" id="entityName" name="entityName" type="text"
                                    placeholder="e.g., Camarines Norte State College" />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="designation">Designation</label>
                                <input class="form-input" id="designation" name="designation" type="text"
                                    placeholder="e.g., Instructor" required />
                            </div>
                        </div>
                        <div class="step-actions">
                            <button type="button" id="btnGoHome" class="btn-neutral-glass" data-action="go-home"><span
                                    class="btn-icon-left">←</span> Home</button>
                            <button type="button" class="btn-glass" data-action="next-step">Next →</button>
                        </div>
                    </div>

                    <!-- Step 2: Item Details -->
                    <div class="wizard-step" id="step2">
                        <div class="form-grid">
                            <div class="form-group full">
                                <label class="form-label">Requested Items</label>
                                <div class="items-table-container">
                                    <table class="items-table" id="itemsTable">
                                        <colgroup>
                                            <col class="col-desc">
                                            <col class="col-unit">
                                            <col class="col-qty">
                                            <col class="col-unit-cost">
                                            <col class="col-total">
                                            <col class="col-actions">
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th class="col-desc">Item Description</th>
                                                <th class="col-unit">Unit</th>
                                                <th class="col-qty">Quantity</th>
                                                <th class="col-unit-cost">Unit Cost (₱)</th>
                                                <th class="col-total">Total Cost (₱)</th>
                                                <th class="col-actions">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="itemsTableBody">
                                            <!-- Rows will be added dynamically -->
                                        </tbody>
                                    </table>
                                </div>
                                <button type="button" id="addItemBtn" class="btn-secondary-glass add-item-btn">+ Add Item</button>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="overallTotalCost">Overall Total Cost (₱)</label>
                                <input class="form-input" id="overallTotalCost" name="overallTotalCost" type="text"
                                    placeholder="Auto-calculated" readonly />
                                <input type="hidden" id="overallTotalCostRaw" name="overallTotalCostRaw" value="" />
                            </div>

                            <div class="form-group full">
                                <label class="form-label" for="neededDate">Date Needed</label>
                                <input class="form-input" id="neededDate" name="neededDate" type="date" />
                            </div>

                            <!-- Purpose field placed below Date Needed -->
                            <div class="form-group full">
                                <label class="form-label" for="purpose">Purpose</label>
                                <textarea class="form-textarea" id="purpose" name="purpose"
                                    placeholder="Describe the purpose / justification for this request" required></textarea>
                            </div>

                        <div class="form-group full">
                            <label class="form-label">Priority</label>
                            <div class="priority-badge-group">
                                <label class="priority-option">
                                    <input type="radio" name="priority" value="Low" required>
                                    <span class="priority-chip"><span class="dot"
                                            style="background:#22c55e"></span>Low</span>
                                </label>
                                <label class="priority-option">
                                    <input type="radio" name="priority" value="Medium">
                                    <span class="priority-chip"><span class="dot"
                                            style="background:#eab308"></span>Medium</span>
                                </label>
                                <label class="priority-option">
                                    <input type="radio" name="priority" value="High">
                                    <span class="priority-chip"><span class="dot"
                                            style="background:#ef4444"></span>High</span>
                                </label>
                                <label class="priority-option">
                                    <input type="radio" name="priority" value="Urgent">
                                    <span class="priority-chip"><span class="dot"
                                            style="background:#dc2626"></span>Urgent</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- PR additional fields used by the PDF template (optional) -->
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label" for="prNo">PR No. <small class="small">(optional)</small></label>
                                <input class="form-input" id="prNo" name="prNo" type="text" placeholder="e.g., PR-2025-001" />
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="fundCluster">Fund Cluster <small class="small">(optional)</small></label>
                                <input class="form-input" id="fundCluster" name="fundCluster" type="text" placeholder="e.g., 101" />
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="responsibilityCenterCode">Responsibility Center Code <small class="small">(optional)</small></label>
                                <input class="form-input" id="responsibilityCenterCode" name="responsibilityCenterCode" type="text" placeholder="e.g., 1234" />
                            </div>
                        </div>
                        <!-- close .form-grid -->
                        </div>

                        <div class="step-actions">
                            <button type="button" class="btn-secondary-glass" data-action="prev-step">← Back</button>
                            <button type="button" class="btn-glass" data-action="next-step">Next →</button>
                        </div>
                    </div>

                    <!-- Step 3: Review and Submit -->
                    <div class="wizard-step" id="step3">
                        <!-- Request Summary -->
                        <div class="request-summary">
                            <h3 class="summary-title">Request Summary</h3>
                            <div class="summary-content">
                                <div class="summary-row">
                                    <span class="summary-label">Email:</span>
                                    <span class="summary-value" id="summary-email">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Requester:</span>
                                    <span class="summary-value" id="summary-requester">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Entity:</span>
                                    <span class="summary-value" id="summary-entityName">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Department:</span>
                                    <span class="summary-value" id="summary-department">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Designation:</span>
                                    <span class="summary-value" id="summary-designation">-</span>
                                </div>
                                <div class="summary-row full">
                                    <span class="summary-label">Requested Items:</span>
                                    <div class="summary-items-table" id="summary-items">
                                        <!-- Items table will be populated here -->
                                    </div>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Overall Total Cost:</span>
                                    <span class="summary-value" id="summary-overallTotalCost">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">PR No.:</span>
                                    <span class="summary-value" id="summary-prNo">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Fund Cluster:</span>
                                    <span class="summary-value" id="summary-fundCluster">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Responsibility Center Code:</span>
                                    <span class="summary-value" id="summary-responsibilityCenterCode">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Date Needed:</span>
                                    <span class="summary-value" id="summary-neededDate">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Priority:</span>
                                    <span class="summary-value" id="summary-priority">-</span>
                                </div>
                                <div class="summary-row full">
                                    <span class="summary-label">Purpose:</span>
                                    <span class="summary-value" id="summary-purpose">-</span>
                                </div>
                            </div>
                        </div>

                        <div class="step-actions">
                            <button type="button" class="btn-secondary-glass" data-action="prev-step">← Back</button>
                            <button type="button" class="btn-neutral-glass" data-action="view-form">View Form</button>
                            <button type="reset" class="btn-secondary-glass" id="btnReset">Reset</button>
                            <button type="submit" class="btn-glass" data-action="submit-form">Submit Request →</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </main>

    <!-- Confirmation Dialog -->
    <dialog id="requestDialog" class="login-dialog">
        <form method="dialog">
            <h3>Confirm Submission</h3>
            <p id="dialogText">Review details?</p>
            <menu>
                <button type="submit" value="cancel">Cancel</button>
                <button type="submit" value="confirm">Submit</button>
            </menu>
        </form>
    </dialog>

    <!-- Success Dialog -->
    <dialog id="successDialog" class="login-dialog">
        <form method="dialog">
            <h3>Request Sent</h3>
            <p id="successText">Your request has been submitted.</p>
            <menu>
                <button type="submit" value="ok">OK</button>
            </menu>
        </form>
    </dialog>

    </dialog>

</body>

</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/user/user-request.blade.php ENDPATH**/ ?>