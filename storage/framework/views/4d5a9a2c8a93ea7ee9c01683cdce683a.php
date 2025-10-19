<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Purchase Request • SPMO</title>
    <?php echo app('Illuminate\Foundation\Vite')('resources/css/AccessSystem.css'); ?>
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
            max-width: 640px;
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

        @media(max-width:620px) {
            .two-col {
                grid-template-columns: 1fr
            }
        }
    </style>
</head>

<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <img src="<?php echo e($imagesPath); ?>/cnscrefine.png" alt="CNSC Logo" />
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
                <form class="request-card" id="purchaseRequestForm" onsubmit="handleRequestSubmit(event)">
                    <div class="request-header">
                        <h2>Purchase Request</h2>
                        <div class="request-subtitle">Submit an item requisition for approval</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="email">Email Address</label>
                        <input class="form-input" id="email" name="email" type="email"
                            placeholder="your.email@cnsc.edu.ph" required />
                    </div>

                    <div class="two-col">
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
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="items">Requested Items</label>
                        <textarea class="form-textarea" id="items" name="items"
                            placeholder="List items with optional quantities..." required></textarea>
                    </div>

                    <div class="two-col">
                        <div class="form-group">
                            <label class="form-label" for="unit">Unit of Measurement</label>
                            <input class="form-input" id="unit" name="unit" type="text" placeholder="e.g., box / pcs"
                                required />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="neededDate">Date Needed</label>
                            <input class="form-input" id="neededDate" name="neededDate" type="date" />
                        </div>
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

                    <div class="request-actions">
                        <button type="button" class="btn-neutral-glass" onclick="goHome()"><span
                                class="btn-icon-left">←</span> Home</button>
                        <button type="reset" class="btn-secondary-glass" onclick="onResetForm()">Reset</button>
                        <button type="submit" class="btn-glass">Submit Request →</button>
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
        function harvestForm() {
            const f = document.getElementById('purchaseRequestForm');
            const data = new FormData(f);
            const obj = {};
            data.forEach((v, k) => obj[k] = v);
            return obj;
        }
        function goHome() {
            // Navigate back to user homepage or access system
            window.location.href = '<?php echo e(route("user.user-home-page")); ?>';
        }
        function toast(msg) {
            // Deprecated: kept for backward compatibility - see showToast API below
            showToast({ message: msg, type: 'info' });
        }
        
        /* Enhanced toast system --------------------------------------------------
         - Supports types: info, success, error
         - Queueing, progress bar, pause-on-hover, accessible ARIA
         - Use: showToast({message, type='info', duration=3000})
        -------------------------------------------------------------------------*/
        function createToastContainer() {
            let c = document.getElementById('ui-alert-container');
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

                const inner = document.createElement('div');
                inner.className = 'ui-toast-inner';

                const text = document.createElement('div');
                text.className = 'ui-toast-text';
                text.textContent = message;

                const close = document.createElement('button');
                close.className = 'ui-toast-close';
                close.setAttribute('aria-label', 'Dismiss notification');
                close.innerHTML = '&times;';
                close.addEventListener('click', () => removeToast(toast));

                const progress = document.createElement('div');
                progress.className = 'ui-toast-progress';

                inner.appendChild(text);
                inner.appendChild(close);
                toast.appendChild(inner);
                toast.appendChild(progress);

                container.appendChild(toast);

                // animation start
                requestAnimationFrame(() => toast.classList.add('ui-toast-in'));

                let start = Date.now();
                let elapsed = 0;
                let remaining = duration;
                let rafId = null;
                let paused = false;

                function tick() {
                    if (paused) { rafId = requestAnimationFrame(tick); return; }
                    elapsed = Date.now() - start;
                    const pct = Math.min(1, elapsed / duration);
                    progress.style.transform = `scaleX(${1 - pct})`;
                    if (elapsed >= duration) {
                        removeToast(toast);
                    } else {
                        rafId = requestAnimationFrame(tick);
                    }
                }

                // pause on hover / focus
                toast.addEventListener('mouseenter', () => { paused = true; });
                toast.addEventListener('mouseleave', () => { paused = false; start = Date.now() - elapsed; });
                toast.addEventListener('focusin', () => { paused = true; });
                toast.addEventListener('focusout', () => { paused = false; start = Date.now() - elapsed; });

                // start ticking
                rafId = requestAnimationFrame(tick);

                // cleanup helper
                function removeToast(node) {
                    if (!node) return;
                    node.classList.remove('ui-toast-in');
                    node.classList.add('ui-toast-out');
                    // small delay to allow exit animation
                    setTimeout(() => node.remove(), 320);
                    if (rafId) cancelAnimationFrame(rafId);
                }

                // expose remove on the element for close button and other code
                toast.removeToast = () => removeToast(toast);

                return toast;
            } catch (e) {
                // fallback
                console.log(message);
            }
        }
        function onResetForm() {
            // slight defer because type=reset triggers before custom code sometimes
            setTimeout(() => toast('Form cleared'), 50);
        }
        function clearAllRequests() {
            if (confirm('⚠️ Are you sure you want to clear ALL stored requests? This cannot be undone!')) {
                try {
                    localStorage.removeItem('userPurchaseRequests');
                    toast('✅ All requests cleared from storage');
                    console.log('LocalStorage cleared: userPurchaseRequests');
                } catch (e) {
                    console.error('Error clearing localStorage:', e);
                    toast('❌ Error clearing storage');
                }
            }
        }
        async function handleRequestSubmit(e) {
            e.preventDefault();
            const d = harvestForm();
            const dlg = document.getElementById('requestDialog');
            const txt = document.getElementById('dialogText');
            txt.textContent = `Submit request for ${d.items?.slice(0, 60) || ''} (${d.priority || 'No priority'})?`;
            const proceed = await new Promise((res) => {
                if (typeof dlg.showModal === 'function') {
                    dlg.showModal();
                    dlg.addEventListener('close', function onClose() {
                        dlg.removeEventListener('close', onClose);
                        res(dlg.returnValue === 'confirm');
                    });
                } else {
                    res(confirm('Submit purchase request?'))
                }
            })
            if (!proceed) return;
            // attempt to persist to server first
            try {
                const resp = await fetch('/api/purchase-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify(d),
                })
                if (!resp.ok) throw new Error('Network response was not ok')
                const data = await resp.json()
                showSuccessServer(data)
            } catch (err) {
                console.error('Server save failed, falling back to localStorage', err)
                // fallback to localStorage behavior
                showSuccessLocal(d)
            }
        }
        function showSuccessServer(d) {
            // server returned created record
            const s = document.getElementById('successDialog');
            const txt = document.getElementById('successText');
            const rid = d.request_id || d.requestId || d.requestId || 'submitted';
            // Message: include whether server sent the confirmation email
            if (d.email_sent === true) {
                txt.textContent = `Request ${rid} submitted successfully. A confirmation email has been sent to you.`;
            } else if (d.email_sent === false) {
                txt.textContent = `Request ${rid} submitted successfully. We were unable to send a confirmation email — please contact admin if you don't receive one.`;
            } else {
                txt.textContent = `Request ${rid} submitted successfully. Please check your email for confirmation and updates.`;
            }

            // Additionally show a transient toast summarizing email status
            if (d.email_sent === true) {
                showToast({ message: '✅ Confirmation email sent to your address.', type: 'success', duration: 4500 });
            } else if (d.email_sent === false) {
                showToast({ message: '⚠️ Could not send confirmation email. Your request was saved.', type: 'error', duration: 6000 });
            } else {
                showToast({ message: 'Request submitted.', type: 'success', duration: 3500 });
            }

            // show dialog if supported
            if (typeof s.showModal === 'function') { s.showModal(); }
            document.getElementById('purchaseRequestForm').reset();
        }

        function showSuccessLocal(d) {
            // Save request to localStorage for admin dashboard
            let existingRequests = [];
            try {
                const stored = localStorage.getItem('userPurchaseRequests');
                if (stored) {
                    existingRequests = JSON.parse(stored);
                }
            } catch (e) {
                console.error('Error reading existing requests:', e);
            }

            const currentYear = new Date().getFullYear();
            const nextNumber = existingRequests.length + 1;
            const requestId = `REQ-${currentYear}-` + String(nextNumber).padStart(3, '0');
            const timestamp = new Date().toISOString();
            const request = {
                requestId: requestId,
                email: d.email,
                requester: d.requester,
                department: d.department,
                items: d.items,
                unit: d.unit,
                neededDate: d.neededDate || 'Not specified',
                priority: d.priority,
                status: 'Incoming',
                submittedDate: timestamp,
                timestamp: timestamp
            };

            existingRequests.push(request);

            try {
                localStorage.setItem('userPurchaseRequests', JSON.stringify(existingRequests));
            } catch (e) {
                console.error('Error saving request:', e);
            }

            const s = document.getElementById('successDialog');
            const txt = document.getElementById('successText');
            txt.textContent = `Request ${requestId} saved locally and will be visible in the dashboard. Please contact admin if you need confirmation.`;
            if (typeof s.showModal === 'function') { s.showModal(); } else showToast({ message: `Request ${requestId} saved locally.`, type: 'success' });
            document.getElementById('purchaseRequestForm').reset();
        }
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

</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/user/user-request.blade.php ENDPATH**/ ?>