<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>Purchase Request • SPMO</title>
    @vite('resources/css/user-request.css')
    @vite('resources/js/user-request.js')
    <link rel="shortcut icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
    <link rel="icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
</head>

<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <img src="{{ $imagesPath }}/cnscrefine.png" alt="CNSC Logo" />
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
                                <label class="form-label" for="requester">Requester</label>
                                <input class="form-input" id="requester" name="requester" type="text"
                                    placeholder="Full name" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="email">Email Address</label>
                                <input class="form-input" id="email" name="email" type="email"
                                    placeholder="your.email@cnsc.edu.ph" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="department">Department</label>
                                <select class="form-input" id="department" name="department" required>
                                    <option value="" disabled selected>Select Department</option>
                                    <!-- Options will be populated by JS -->
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="designation">Designation</label>
                                <input class="form-input" id="designation" name="designation" type="text"
                                    placeholder="e.g., Instructor" required />
                            </div>

                            <div class="form-group full">
                                <label class="form-label" for="entityName">Entity Name <small class="small">(optional)</small></label>
                                <input class="form-input" id="entityName" name="entityName" type="text"
                                    placeholder="e.g., Camarines Norte State College" />
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
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; flex-wrap: wrap; gap: 1rem;">
                                    <button type="button" id="addItemBtn" class="btn-secondary-glass add-item-btn" style="margin-top:0">+ Add Item</button>
                                    
                                    <div class="total-cost-display">
                                        <label class="form-label" for="overallTotalCost">Overall Total (₱)</label>
                                        <input class="form-input" id="overallTotalCost" name="overallTotalCost" type="text"
                                            placeholder="0.00" readonly />
                                        <input type="hidden" id="overallTotalCostRaw" name="overallTotalCostRaw" value="" />
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="neededDate">Date Needed</label>
                                <input class="form-input" id="neededDate" name="neededDate" type="date" />
                            </div>

                            <div class="form-group">
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

                            <div class="form-group full">
                                <label class="form-label" for="purpose">Purpose</label>
                                <textarea class="form-textarea" id="purpose" name="purpose"
                                    placeholder="Describe the purpose / justification for this request" required></textarea>
                            </div>

                            <!-- Optional Fields Header -->
                            <div class="form-group full">
                                <div style="margin: 1.5rem 0 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; color: var(--accent-gold); font-size: 0.9rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
                                    Administrative Details (Optional)
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="prNo">PR No.</label>
                                <input class="form-input" id="prNo" name="prNo" type="text" placeholder="e.g., PR-2025-001" />
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="fundCluster">Fund Cluster</label>
                                <select class="form-input" id="fundCluster" name="fundCluster">
                                    <option value="" disabled selected>Select Fund Cluster</option>
                                    <option value="01 - Regular Agency Fund">01 - Regular Agency Fund</option>
                                    <option value="05 - Internally Generated Funds">05 - Internally Generated Funds</option>
                                    <option value="06 - Business Related Funds">06 - Business Related Funds</option>
                                    <option value="07 - Trust Receipts">07 - Trust Receipts</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="responsibilityCenterCode">Responsibility Center Code</label>
                                <input class="form-input" id="responsibilityCenterCode" name="responsibilityCenterCode" type="text" placeholder="e.g., 1234" />
                            </div>
                        </div>

                        <div class="step-actions">
                            <button type="button" class="btn-secondary-glass" data-action="prev-step"><span class="btn-icon-left">←</span> Back</button>
                            <button type="button" class="btn-glass" data-action="next-step">Next →</button>
                        </div>
                    </div>

                    <!-- Step 3: Review and Submit -->
                    <div class="wizard-step" id="step3">
                        <div class="review-container">
                            <div class="review-header">
                                <h3>Review Your Request</h3>
                                <p>Please verify the information below before submitting.</p>
                            </div>

                            <div class="review-sections">
                                <!-- Section 1: Requester Info -->
                                <div class="review-section">
                                    <div class="review-section-header">
                                        <h4 class="review-section-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                            Requester Information
                                        </h4>
                                        <button type="button" class="btn-edit-section" data-action="goto-step-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                            Edit
                                        </button>
                                    </div>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="label">Requester</span>
                                            <span class="value" id="summary-requester">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="label">Email</span>
                                            <span class="value" id="summary-email">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="label">Department</span>
                                            <span class="value" id="summary-department">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="label">Designation</span>
                                            <span class="value" id="summary-designation">-</span>
                                        </div>
                                        <div class="review-item full-width">
                                            <span class="label">Entity Name</span>
                                            <span class="value" id="summary-entityName">-</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Section 2: Request Details -->
                                <div class="review-section">
                                    <div class="review-section-header">
                                        <h4 class="review-section-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                                            Request Details
                                        </h4>
                                        <button type="button" class="btn-edit-section" data-action="goto-step-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                            Edit
                                        </button>
                                    </div>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="label">Date Needed</span>
                                            <span class="value" id="summary-neededDate">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="label">Priority</span>
                                            <span class="value" id="summary-priority">-</span>
                                        </div>
                                        <div class="review-item full-width">
                                            <span class="label">Purpose</span>
                                            <span class="value" id="summary-purpose">-</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Section 3: Items -->
                                <div class="review-section">
                                    <div class="review-section-header">
                                        <h4 class="review-section-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                            Items Requested
                                        </h4>
                                        <button type="button" class="btn-edit-section" data-action="goto-step-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                            Edit
                                        </button>
                                    </div>
                                    <div class="summary-items-wrapper" id="summary-items">
                                        <!-- Items table will be populated here -->
                                    </div>
                                    <div class="review-total">
                                        <span class="label">Overall Total Cost</span>
                                        <span class="value" id="summary-overallTotalCost">-</span>
                                    </div>
                                </div>

                                <!-- Section 4: Admin Details (Conditional/Optional) -->
                                <div class="review-section optional-section">
                                    <div class="review-section-header">
                                        <h4 class="review-section-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16zM14 10h-4v2h4v-2zm0 4h-4v2h4v-2z"/></svg>
                                            Administrative Details
                                        </h4>
                                        <button type="button" class="btn-edit-section" data-action="goto-step-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                            Edit
                                        </button>
                                    </div>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="label">PR No.</span>
                                            <span class="value" id="summary-prNo">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="label">Fund Cluster</span>
                                            <span class="value" id="summary-fundCluster">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="label">Responsibility Center Code</span>
                                            <span class="value" id="summary-responsibilityCenterCode">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="step-actions">
                            <button type="button" class="btn-secondary-glass" data-action="prev-step"><span class="btn-icon-left">←</span> Back</button>
                            <button type="reset" class="btn-secondary-glass" id="btnReset">Reset</button>
                            <button type="button" class="btn-neutral-glass" data-action="view-form">View Form</button>
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

</html>