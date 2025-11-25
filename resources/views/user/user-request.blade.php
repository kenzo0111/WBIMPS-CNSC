<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>Purchase Request • SPMO</title>
    @vite('resources/css/AccessSystem.css')
    <link rel="shortcut icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
    <link rel="icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
    <style>
        /* Extend existing AccessSystem styles for textarea & request form */
        .request-card {
            /* mirrors .login-card base */
            background: rgba(255, 255, 255, 0.1);
            -webkit-backdrop-filter: blur(25px);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 24px;
            padding: 2.2rem 2.2rem 2rem;
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            animation: fadeInUp .8s ease-out .15s both;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
        }

        .request-header h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #fff;
            margin: 0 0 .35rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, .35);
        }

        .request-subtitle {
            font-size: .95rem;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 1.25rem;
        }

        .form-textarea,
        .priority-badge-group {
            width: 100%;
        }

        .form-textarea {
            resize: vertical;
            min-height: 110px;
            padding: 1rem 1.25rem;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
            font-size: 1rem;
            outline: none;
            transition: .3s;
            line-height: 1.4;
        }

        .form-textarea::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }

        .form-textarea:focus {
            border-color: #ffd500;
            background: rgba(255, 255, 255, 0.22);
            box-shadow: 0 0 20px rgba(255, 213, 0, 0.25);
        }

        .priority-badge-group {
            display: flex;
            gap: .75rem;
            flex-wrap: wrap;
            margin-top: .35rem;
        }

        .priority-option {
            position: relative;
        }

        .priority-option input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }

        .priority-chip {
            display: inline-flex;
            align-items: center;
            gap: .45rem;
            padding: .55rem .95rem;
            border-radius: 30px;
            font-size: .8rem;
            font-weight: 600;
            letter-spacing: .5px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            cursor: pointer;
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
            transition: .25s;
        }

        .priority-chip:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .priority-option input:checked+.priority-chip {
            background: linear-gradient(135deg, #ff4444, #b30000);
            border-color: rgba(255, 213, 0, 0.6);
            box-shadow: 0 6px 16px rgba(255, 68, 68, 0.45);
        }

        .priority-chip span.dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ffd500;
            box-shadow: 0 0 0 3px rgba(255, 213, 0, 0.25);
        }

        .request-actions {
            margin-top: 1.2rem;
            display: flex;
            gap: .9rem;
            flex-wrap: wrap;
        }

        .btn-glass {
            flex: 1 1 160px;
            border: none;
            border-radius: 50px;
            padding: 1rem 1.5rem;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: .6rem;
            transition: .3s;
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, #ff4444 0%, #b30000 100%);
            color: #fff;
            box-shadow: 0 8px 25px rgba(255, 68, 68, 0.4);
        }

        .btn-glass:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 34px rgba(255, 68, 68, 0.55);
        }

        .btn-secondary-glass,
        .btn-neutral-glass {
            flex: 1 1 130px;
            border: none;
            border-radius: 50px;
            padding: 1rem 1.25rem;
            font-weight: 600;
            font-size: .95rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: .55rem;
            transition: .3s;
            background: rgba(255, 255, 255, 0.18);
            color: #fff;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
            -webkit-backdrop-filter: blur(14px);
            backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.32);
        }

        .btn-secondary-glass:hover,
        .btn-neutral-glass:hover {
            background: rgba(255, 255, 255, 0.28);
            transform: translateY(-3px);
        }

        .btn-neutral-glass {
            background: rgba(255, 255, 255, 0.12);
        }

        .btn-neutral-glass:hover {
            background: rgba(255, 255, 255, 0.22);
        }

        .btn-icon-left {
            font-size: 1.1rem;
            line-height: 0;
            display: inline-block;
        }

        .badge-small {
            display: inline-block;
            padding: .35rem .75rem;
            background: rgba(255, 255, 255, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 25px;
            font-size: .65rem;
            letter-spacing: .5px;
            margin: 0 0 1.2rem;
            animation: fadeInUp .8s ease-out;
        }

        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.1rem;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        /* Make all fields in step 1 expand to full width (one column) */
        .wizard-step#step1 .form-grid {
            grid-template-columns: 1fr;
        }

        .full {
            grid-column: span 2;
        }

        @media(max-width:620px) {
            .two-col {
                grid-template-columns: 1fr
            }
        }

        @media(max-width:768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            .full {
                grid-column: span 1;
            }
        }

        /* Wizard Styles */
        .wizard-progress {
            margin-bottom: 2rem;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 1.5rem;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffd500, #ff4444);
            width: 33.33%;
            transition: width 0.3s ease;
        }

        .progress-steps {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            opacity: 0.5;
            transition: opacity 0.3s ease;
        }

        .step.active {
            opacity: 1;
        }

        .step-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            font-weight: 600;
            color: #fff;
            transition: all 0.3s ease;
        }

        .step.active .step-number {
            background: linear-gradient(135deg, #ffd500, #ff4444);
            border-color: rgba(255, 213, 0, 0.6);
            box-shadow: 0 0 15px rgba(255, 213, 0, 0.4);
        }

        .step-label {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
            text-align: center;
        }

        .wizard-step {
            display: none;
            animation: fadeInUp 0.5s ease-out;
        }

        .wizard-step.active {
            display: block;
        }

        .step-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        @media(max-width: 768px) {
            .progress-steps {
                flex-wrap: wrap;
                gap: 1rem;
            }
            .step {
                flex: 1;
                min-width: 80px;
            }
            .step-actions {
                flex-direction: column;
            }
            .step-actions button {
                width: 100%;
            }
        }

        /* Request Summary Styles */
        .request-summary {
            margin: 2rem 0;
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }

        .summary-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #fff;
            margin: 0 0 1rem 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .summary-content {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.75rem;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .summary-row:last-child {
            border-bottom: none;
        }

        .summary-label {
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }

        .summary-value {
            font-weight: 600;
            color: #fff;
            font-size: 0.9rem;
            text-align: right;
            max-width: 60%;
            word-wrap: break-word;
        }

        @media(max-width: 768px) {
            .summary-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.25rem;
            }
            .summary-value {
                text-align: left;
                max-width: 100%;
            }
        }
    </style>
</head>

<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <img src="{{ $imagesPath }}/cnscrefine.png" alt="CNSC Logo" />
                <div class="logo-text">
                    <h1>Supply and Property Management</h1>
                    <hr />
                    <p>WEB-BASED INVENTORY AND PROCUREMENT MANAGEMENT SYSTEM</p>
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
                                <label class="form-label" for="items">Requested Items</label>
                                <textarea class="form-textarea" id="items" name="items"
                                    placeholder="List items with optional quantities..." required></textarea>
                            </div>


                            <div class="form-group">
                                <label class="form-label" for="unit">Unit of Measurement</label>
                                <input class="form-input" id="unit" name="unit" type="text" placeholder="e.g., box / pcs"
                                    required />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="quantity">Quantity</label>
                                <input class="form-input" id="quantity" name="quantity" type="number" min="1" step="1"
                                    placeholder="e.g., 10" />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="unitCost">Unit Cost (₱)</label>
                                <input class="form-input" id="unitCost" name="unitCost" type="number" min="0" step="0.01"
                                    placeholder="e.g., 1500.00" />
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="totalCost">Total Cost (₱)</label>
                                <input class="form-input" id="totalCost" name="totalCost" type="text"
                                    placeholder="Auto-calculated" readonly />
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
                                    <span class="summary-label">Department:</span>
                                    <span class="summary-value" id="summary-department">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Designation:</span>
                                    <span class="summary-value" id="summary-designation">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Items:</span>
                                    <span class="summary-value" id="summary-items">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Purpose:</span>
                                    <span class="summary-value" id="summary-purpose">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Unit:</span>
                                    <span class="summary-value" id="summary-unit">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Quantity:</span>
                                    <span class="summary-value" id="summary-quantity">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Unit Cost:</span>
                                    <span class="summary-value" id="summary-unitCost">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Total Cost:</span>
                                    <span class="summary-value" id="summary-totalCost">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Date Needed:</span>
                                    <span class="summary-value" id="summary-neededDate">-</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Priority:</span>
                                    <span class="summary-value" id="summary-priority">-</span>
                                </div>
                            </div>
                        </div>

                        <div class="request-actions">
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

    <script>
        (function() {
            'use strict';

            // Module scope variables
            const form = document.getElementById('purchaseRequestForm');
            const dialogConfirm = document.getElementById('requestDialog');
            const dialogSuccess = document.getElementById('successDialog');
            const dialogText = document.getElementById('dialogText');
            const successText = document.getElementById('successText');

            // Wizard state
            let currentStep = 1;
            const totalSteps = 3;

            // --- Small helper utilities ---
            function byId(id) { return document.getElementById(id); }

            function harvestForm() {
                const data = new FormData(form);
                const obj = {};
                data.forEach((v, k) => obj[k] = v);
                return obj;
            }

            function goHome() {
                // navigate back to the user's home page (blade will render route)
                window.location.href = '{{ route("user.user-home-page") }}';
            }

            // --- Toast UI ---
            function createToastContainer() {
                let c = byId('ui-alert-container');
                if (!c) {
                    c = document.createElement('div');
                    c.id = 'ui-alert-container';
                    c.className = 'ui-alert-container';
                    c.setAttribute('aria-live', 'polite');
                    document.body.appendChild(c);
                }
                return c;
            }

            function showToast({ message = '', type = 'info', duration = 3500 } = {}) {
                try {
                    const container = createToastContainer();
                    const toast = document.createElement('div');
                    toast.className = `ui-toast ui-toast-${type}`;
                    toast.setAttribute('role', 'status');
                    toast.setAttribute('aria-atomic', 'true');

                    const inner = document.createElement('div'); inner.className = 'ui-toast-inner';
                    const text = document.createElement('div'); text.className = 'ui-toast-text'; text.textContent = message;
                    const close = document.createElement('button');
                    close.className = 'ui-toast-close'; close.setAttribute('aria-label', 'Dismiss notification'); close.innerHTML = '&times;';
                    const progress = document.createElement('div'); progress.className = 'ui-toast-progress';

                    close.addEventListener('click', () => removeToast(toast));
                    inner.appendChild(text); inner.appendChild(close);
                    toast.appendChild(inner); toast.appendChild(progress);
                    container.appendChild(toast);

                    requestAnimationFrame(() => toast.classList.add('ui-toast-in'));

                    let start = Date.now(); let elapsed = 0; let rafId = null; let paused = false;
                    function tick() {
                        if (paused) { rafId = requestAnimationFrame(tick); return; }
                        elapsed = Date.now() - start;
                        const pct = Math.min(1, elapsed / duration);
                        progress.style.transform = `scaleX(${1 - pct})`;
                        if (elapsed >= duration) removeToast(toast); else rafId = requestAnimationFrame(tick);
                    }

                    toast.addEventListener('mouseenter', () => { paused = true; });
                    toast.addEventListener('mouseleave', () => { paused = false; start = Date.now() - elapsed; });
                    toast.addEventListener('focusin', () => { paused = true; });
                    toast.addEventListener('focusout', () => { paused = false; start = Date.now() - elapsed; });

                    rafId = requestAnimationFrame(tick);

                    function removeToast(node) {
                        if (!node) return;
                        node.classList.remove('ui-toast-in'); node.classList.add('ui-toast-out');
                        setTimeout(() => node.remove(), 320);
                        if (rafId) cancelAnimationFrame(rafId);
                    }

                    toast.removeToast = () => removeToast(toast);
                    return toast;
                } catch (err) {
                    // fallback
                    console.log(message);
                }
            }

            // alias kept for backward-compat
            function toast(msg) { showToast({ message: msg, type: 'info' }); }

            // friendly currency formatting
            function formatCurrency(value) {
                if (value === null || value === undefined || String(value).trim() === '') return '—';
                const raw = String(value).replace(/,/g, '').trim();
                const num = Number(raw);
                if (Number.isNaN(num)) return value;
                try {
                    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(num);
                } catch (e) {
                    const fixed = num.toFixed(2);
                    return '₱' + fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                }
            }

            // --- Calculation / validation ---
            function calculateTotalCost() {
                const qty = parseFloat(byId('quantity').value) || 0;
                const unit = parseFloat(byId('unitCost').value) || 0;
                const total = qty * unit;
                const totalCostField = byId('totalCost');
                totalCostField.value = total > 0 ? total.toFixed(2) : '';
                if (currentStep === 3) updateSummary();
            }

            function onResetForm() {
                // form reset fires before DOM values change, use slight delay
                setTimeout(() => {
                    toast('Form cleared');
                    currentStep = 1; updateProgress();
                }, 50);
            }

            // --- Wizard helpers ---
            function updateProgress() {
                const fill = byId('progressFill');
                fill.style.width = `${(currentStep / totalSteps) * 100}%`;
                document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i + 1 === currentStep));
                document.querySelectorAll('.wizard-step').forEach((s, i) => s.classList.toggle('active', i + 1 === currentStep));
                if (currentStep === 3) updateSummary();
            }

            function updateSummary() {
                const fields = ['email', 'requester', 'department', 'designation', 'items', 'purpose', 'unit', 'quantity', 'unitCost', 'totalCost', 'neededDate', 'priority'];
                fields.forEach(field => {
                    const target = byId(`summary-${field}`);
                    if (!target) return;
                    let value = '-';
                    if (field === 'priority') {
                        const checked = document.querySelector('input[name="priority"]:checked');
                        value = checked ? checked.value : '-';
                    } else {
                        const el = byId(field);
                        value = el ? (el.value || '-') : '-';
                    }

                    if (value !== '-') {
                        if (field === 'unitCost' || field === 'totalCost') value = formatCurrency(value);
                        if (field === 'neededDate') {
                            const d = new Date(value); value = isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                        }
                        if (field === 'quantity') value = parseInt(value) ? parseInt(value).toLocaleString() : value;
                    }

                    target.textContent = value;
                });
            }

            function validateCurrentStep() {
                const stepEl = byId(`step${currentStep}`);
                if (!stepEl) return true;

                const required = stepEl.querySelectorAll('input[required], textarea[required]');
                let ok = true;
                required.forEach(field => {
                    let valid = true;
                    if (field.type === 'radio') {
                        valid = !!document.querySelector(`input[name="${field.name}"]:checked`);
                    } else {
                        valid = String(field.value || '').trim().length > 0;
                    }

                    if (!valid) {
                        field.style.borderColor = '#ff4444';
                        field.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.3)';
                        ok = false;
                    } else {
                        field.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        field.style.boxShadow = 'none';
                    }
                });

                if (!ok) showToast({ message: 'Please fill in all required fields', type: 'error', duration: 3000 });
                return ok;
            }

            function nextStep() {
                if (currentStep < totalSteps && validateCurrentStep()) {
                    currentStep++; updateProgress();
                    showToast({ message: `Step ${currentStep} of ${totalSteps}`, type: 'info', duration: 1500 });
                }
            }

            function prevStep() { if (currentStep > 1) { currentStep--; updateProgress(); showToast({ message: `Step ${currentStep} of ${totalSteps}`, type: 'info', duration: 1200 }); } }

            // --- Persistence / submit handlers ---
            async function handleRequestSubmit(e) {
                e.preventDefault();
                const payload = harvestForm();

                const shortPurpose = payload.purpose ? `Purpose: ${String(payload.purpose).slice(0, 80)}${String(payload.purpose).length > 80 ? '…' : ''}` : '';
                dialogText.textContent = `Submit request for ${payload.items?.slice(0, 60) || ''} (${payload.priority || 'No priority'}) — Qty: ${payload.quantity || '—'} Total cost: ${formatCurrency(payload.totalCost)}${shortPurpose ? ' — ' + shortPurpose : ''}?`;

                const proceed = await new Promise((res) => {
                    if (typeof dialogConfirm.showModal === 'function') {
                        dialogConfirm.showModal();
                        dialogConfirm.addEventListener('close', function onClose() { dialogConfirm.removeEventListener('close', onClose); res(dialogConfirm.returnValue === 'confirm'); });
                    } else {
                        res(confirm('Submit purchase request?'));
                    }
                });

                if (!proceed) return;

                try {
                    const resp = await fetch('/api/purchase-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify(payload) });
                    if (!resp.ok) throw new Error('Network response was not ok');
                    const data = await resp.json();
                    showSuccessServer(data);
                } catch (err) {
                    console.error('Server save failed, falling back to localStorage', err);
                    showSuccessLocal(payload);
                }
            }

            function findRequestIdFromServer(data) {
                // normalize server payload to pick an ID
                return data?.request_id || data?.requestId || data?.id || 'submitted';
            }

            function showSuccessServer(data) {
                const rid = findRequestIdFromServer(data);
                if (data.email_sent === true) {
                    successText.textContent = `Request ${rid} submitted successfully. A confirmation email has been sent to you.`;
                    showToast({ message: '✅ Confirmation email sent to your address.', type: 'success', duration: 4500 });
                } else if (data.email_sent === false) {
                    successText.textContent = `Request ${rid} submitted successfully. We were unable to send a confirmation email — please contact admin if you don't receive one.`;
                    showToast({ message: '⚠️ Could not send confirmation email. Your request was saved.', type: 'error', duration: 6000 });
                } else {
                    successText.textContent = `Request ${rid} submitted successfully. Please check your email for confirmation and updates.`;
                    showToast({ message: 'Request submitted.', type: 'success', duration: 3500 });
                }

                if (typeof dialogSuccess.showModal === 'function') {
                    dialogSuccess.showModal();
                    // only reset once the user closes the success dialog
                    dialogSuccess.addEventListener('close', function onClose() {
                        dialogSuccess.removeEventListener('close', onClose);
                        form.reset(); currentStep = 1; updateProgress();
                    });
                } else {
                    form.reset(); currentStep = 1; updateProgress();
                }
            }

            function showSuccessLocal(d) {
                let existing = [];
                try { const stored = localStorage.getItem('userPurchaseRequests'); if (stored) existing = JSON.parse(stored); } catch (e) { console.error('Error reading local storage', e); }

                const y = new Date().getFullYear(); const nextNumber = existing.length + 1;
                const requestId = `REQ-${y}-` + String(nextNumber).padStart(3, '0');
                const ts = new Date().toISOString();
                const request = Object.assign({}, {
                    requestId, email: d.email, requester: d.requester, department: d.department, designation: d.designation,
                    items: d.items, purpose: d.purpose || null, unit: d.unit, quantity: d.quantity || null, unitCost: d.unitCost || null, totalCost: d.totalCost || null,
                    neededDate: d.neededDate || 'Not specified', priority: d.priority, status: 'Incoming', submittedDate: ts, timestamp: ts
                });

                existing.push(request);
                try { localStorage.setItem('userPurchaseRequests', JSON.stringify(existing)); } catch (e) { console.error('Error saving request:', e); }

                successText.textContent = `Request ${requestId} saved locally and will be visible in the dashboard. Please contact admin if you need confirmation.`;
                if (typeof dialogSuccess.showModal === 'function') {
                    dialogSuccess.showModal();
                    dialogSuccess.addEventListener('close', function onClose() {
                        dialogSuccess.removeEventListener('close', onClose);
                        form.reset(); currentStep = 1; updateProgress();
                    });
                } else {
                    showToast({ message: `Request ${requestId} saved locally.`, type: 'success' });
                    form.reset(); currentStep = 1; updateProgress();
                }

                try {
                    const qty = request.quantity ? `Qty ${request.quantity}` : '';
                    const cost = request.totalCost ? `Total ${formatCurrency(request.totalCost)}` : '';
                    const summary = [qty, cost].filter(Boolean).join(' • ');
                    if (summary) showToast({ message: `${requestId} — ${summary}`, type: 'success', duration: 4200 });
                } catch (e) { /* ignore */ }
            }

            // Optional helper used in developer console
            function clearAllRequests() {
                if (!confirm('⚠️ Are you sure you want to clear ALL stored requests? This cannot be undone!')) return;
                try { localStorage.removeItem('userPurchaseRequests'); showToast({ message: '✅ All requests cleared from storage', type: 'success' }); } catch (e) { console.error(e); showToast({ message: '❌ Error clearing storage', type: 'error' }); }
            }

            // --- Preview helpers (Step 3 "View Form" button) ---
            async function viewFormPreview() {
                // Try to generate the server-side PDF and open it in a new tab. If the request fails or popups are blocked
                // fall back to the previous HTML-only preview.
                const payload = harvestForm();

                // Build headers (include CSRF token when present)
                const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
                const tokenMeta = document.querySelector('meta[name="csrf-token"]');
                if (tokenMeta && tokenMeta.content) headers['X-CSRF-TOKEN'] = tokenMeta.content;

                try {
                    // Normalize items into structured objects so the server can populate the PDF table properly.
                    const serverPayload = Object.assign({}, payload);
                    if (typeof payload.items === 'string' && payload.items.trim().length) {
                        const lines = payload.items.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                        serverPayload.items = lines.map(line => ({
                            item_description: line,
                            quantity: payload.quantity || '',
                            unit_cost: payload.unitCost || '',
                            total_cost: payload.totalCost || '',
                            unit: payload.unit || ''
                        }));
                    }

                    // Map a few common field names that the server-side PDF template expects
                    if (payload.requester) serverPayload.requested_by = payload.requester;
                    if (payload.purpose) serverPayload.purpose = payload.purpose;
                    if (payload.designation) serverPayload.designation = payload.designation;
                    if (payload.neededDate) serverPayload.date = payload.neededDate;

                    const resp = await fetch('/purchase-request/generate', { method: 'POST', headers, body: JSON.stringify(serverPayload) });
                    if (!resp.ok) throw new Error(`Server returned status ${resp.status}`);

                    const blob = await resp.blob();
                    const blobUrl = URL.createObjectURL(blob);

                    // Attempt to open in a new tab/window. If blocked, trigger a download as a fallback.
                    const win = window.open(blobUrl, '_blank');
                    if (!win) {
                        // Popup blocked — force download
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = 'purchase_request.pdf';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    }

                    // Release the blob url after some time
                    setTimeout(() => { URL.revokeObjectURL(blobUrl); }, 60 * 1000);
                    return;
                } catch (err) {
                    showToast({ message: 'Could not generate PDF preview on the server — using local preview.', type: 'warning', duration: 3500 });
                    // Fall through to render local preview like before
                }

                // Local HTML preview fallback (same as existing behavior)
                const totalCost = payload.totalCost ? formatCurrency(payload.totalCost) : '—';
                const itemsHtml = (payload.items || '').replace(/\n/g, '<br/>');

                const preview = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,toolbar=no,menubar=no');
                if (!preview) { showToast({ message: 'Unable to open preview window — popup blocked?', type: 'error', duration: 3000 }); return; }

                const tableRow = (label, val) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #e9e9e9;font-weight:600; width:220px">${label}</td><td style="padding:8px 10px;border-bottom:1px solid #e9e9e9">${val || '—'}</td></tr>`;

                const html = `<!doctype html><html><head><meta charset="utf-8"><title>Purchase Request Preview</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:18px;color:#111} .card{max-width:880px;margin:0 auto;border:1px solid #eee;border-radius:8px;padding:18px;background:#fff} h1{font-size:20px;margin:0 0 10px} table{width:100%;border-collapse:collapse;margin-top:12px} .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px} .btn{padding:8px 12px;border-radius:6px;border:1px solid #ccc;background:#fafafa;cursor:pointer}</style></head><body><div class="card"><h1>Purchase Request Preview</h1><table>`
                    + tableRow('Email', payload.email)
                    + tableRow('Requester', payload.requester)
                    + tableRow('Department', payload.department)
                    + tableRow('Designation', payload.designation)
                    + tableRow('Items', itemsHtml)
                    + tableRow('Unit', payload.unit)
                    + tableRow('Quantity', payload.quantity)
                    + tableRow('Unit Cost', payload.unitCost ? formatCurrency(payload.unitCost) : '')
                    + tableRow('Total Cost', totalCost)
                    + tableRow('Date Needed', payload.neededDate)
                    + tableRow('Priority', payload.priority)
                    + tableRow('Purpose', payload.purpose)
                + `</table><div class="actions"><button class="btn" onclick="window.print()">Print</button><button class="btn" onclick="window.close()">Close</button></div><div style="margin-top:12px;font-size:12px;color:#666">Preview generated locally — not submitted.</div></div></body></html>`;

                preview.document.open(); preview.document.write(html); preview.document.close();
            }

            // --- Event wiring ---
            function handleActionClick(e) {
                const btn = e.target.closest('button');
                const action = btn?.dataset?.action;
                // Prevent the browser's default submit behavior when we intentionally control submits
                if (action === 'submit-form') e.preventDefault();
                if (!action) return;
                switch (action) {
                    case 'go-home': return goHome();
                    case 'next-step': return nextStep();
                    case 'view-form': return viewFormPreview();
                    case 'prev-step': return prevStep();
                    case 'submit-form':
                        // prefer the newer requestSubmit API when available (it triggers the submit event)
                        if (typeof form.requestSubmit === 'function') return form.requestSubmit();
                        return form.submit();
                }
            }

            function init() {
                updateProgress();

                // central click handler for buttons using data-action attributes
                document.addEventListener('click', handleActionClick);

                // form submit, reset
                form.addEventListener('submit', handleRequestSubmit);
                form.addEventListener('reset', onResetForm);

                // priority change updates summary
                document.querySelectorAll('input[name="priority"]').forEach(i => i.addEventListener('change', updateSummary));

                // calculation listeners
                ['quantity', 'unitCost'].forEach(id => { const el = byId(id); if (el) el.addEventListener('input', calculateTotalCost); });

                // Prevent selecting a past date for 'neededDate' - set min to today
                const neededEl = byId('neededDate');
                if (neededEl) {
                    const today = new Date();
                    // format YYYY-MM-DD
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    const minDate = `${yyyy}-${mm}-${dd}`;
                    neededEl.setAttribute('min', minDate);

                    // If the current value is before min, clear it
                    if (neededEl.value && neededEl.value < minDate) {
                        neededEl.value = '';
                        toast('Date needed cannot be earlier than today');
                    }

                    // guard manual input/change as well
                    neededEl.addEventListener('change', () => {
                        if (neededEl.value && neededEl.value < minDate) {
                            neededEl.value = '';
                            showToast({ message: 'Date needed cannot be in the past', type: 'error' });
                        }
                        if (currentStep === 3) updateSummary();
                    });
                }

                // expose a couple helpers for dev environment
                window.PurchaseRequest = { openSuccessDialog: () => dialogSuccess.showModal?.(), clearAllRequests };
            }

            // start
            document.addEventListener('DOMContentLoaded', init);
        })();

        
    </script>

    <style>
        /* Toast UI styles */
        .ui-alert-container {
            position: fixed;
            top: 14px;
            right: 14px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-end;
            pointer-events: none; /* allow clicks through empty areas */
        }
        .ui-toast {
            min-width: 260px;
            max-width: 420px;
            background: rgba(0,0,0,0.72);
            color: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0,0,0,0.5);
            transform: translateY(-8px) scale(.995);
            opacity: 0;
            transition: transform .28s cubic-bezier(.2,.9,.3,1), opacity .22s ease;
            pointer-events: auto;
        }
        .ui-toast.ui-toast-in { transform: translateY(0) scale(1); opacity: 1; }
        .ui-toast.ui-toast-out { transform: translateY(-6px) scale(.98); opacity: 0; }
        .ui-toast-inner { display:flex; gap:8px; align-items:center; padding: 12px 12px 10px 14px; }
        .ui-toast-text { flex:1; font-size:13px; line-height:1.25; }
        .ui-toast-close { background: transparent; border: none; color: rgba(255,255,255,0.9); font-size:18px; padding:6px; margin-left:6px; cursor:pointer; border-radius:6px; }
        .ui-toast-close:focus { outline: 2px solid rgba(255,255,255,0.12); }
        .ui-toast-progress { height:4px; background: linear-gradient(90deg,#ffd500,#ff4444); transform-origin: left center; transition: transform .12s linear; }

        /* Type mods */
        .ui-toast-info { background: linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0.72)); }
        .ui-toast-success { background: linear-gradient(180deg, #0f172a, #063c18); box-shadow: 0 8px 30px rgba(6,60,24,0.35); }
        .ui-toast-error { background: linear-gradient(180deg, #2a0b0b, #3b0b0b); box-shadow: 0 8px 30px rgba(59,11,11,0.35); }

        .ui-toast-success .ui-toast-progress { background: linear-gradient(90deg,#34d399,#059669); }
        .ui-toast-error .ui-toast-progress { background: linear-gradient(90deg,#ff7b7b,#ff3b3b); }

        @media (max-width:640px) {
            .ui-alert-container { left: 16px; right: 16px; top: 12px; align-items: center; }
            .ui-toast { width: calc(100% - 32px); max-width: none; }
        }
    </style>
</body>

</html>