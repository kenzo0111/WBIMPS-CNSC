<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>" />
  <title>SPMO Access System</title>
  <?php echo app('Illuminate\Foundation\Vite')('resources/css/AccessSystem.css'); ?>
  <script>
    window.APP_ROUTES = window.APP_ROUTES || {};
    window.APP_ROUTES.login = "<?php echo e(route('login')); ?>";
    window.APP_ROUTES.loginSubmit = "<?php echo e(route('login.perform')); ?>";
    window.APP_ROUTES.dashboard = "<?php echo e(route('admin.dashboard')); ?>";
  // Patterns for client-side route generation
  window.APP_ROUTES.purchaseOrderView = "<?php echo e(url('/purchase-order/view/{id}')); ?>";
  window.APP_ROUTES.purchaseRequestView = "<?php echo e(url('/purchase-request/view/{id}')); ?>";
  window.APP_ROUTES.inventoryCustodianSlipView = "<?php echo e(url('/inventory-custodian-slip/view/{id}')); ?>";
  </script>
  <style>
    /* Inline styles for dialogs (centered) */
    dialog.loading-dialog,
    dialog.success-dialog,
    dialog.login-dialog {
      border: none;
      border-radius: 14px;
      padding: 32px 40px;
      box-shadow: 0 10px 40px -5px rgba(0, 0, 0, .25);
      font-family: system-ui, sans-serif;
    }

    /* Force centering for all dialogs when open */
    dialog[open] {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      margin: 0;
      max-width: 460px;
      width: calc(100% - 40px);
    }

    dialog.loading-dialog {
      display: flex;
      flex-direction: column;
      gap: 18px;
      align-items: center;
      text-align: center;
    }

    .loading-spinner {
      width: 58px;
      height: 58px;
      border: 5px solid #e5e7eb;
      border-top-color: #dc2626;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      font-size: 15px;
      font-weight: 500;
      color: #374151;
      letter-spacing: .3px;
    }

    dialog.success-dialog {
      text-align: center;
    }

    .success-icon {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      box-shadow: 0 4px 12px rgba(22, 163, 74, .4);
    }

    .success-icon svg {
      width: 38px;
      height: 38px;
      color: #fff;
    }

    dialog.success-dialog h3 {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 600;
      color: #111827;
    }

    dialog.success-dialog p {
      margin: 0 0 20px;
      color: #4b5563;
      font-size: 14px;
    }

    dialog.success-dialog menu {
      display: flex;
      justify-content: center;
      padding: 0;
      margin: 0;
    }

    .primary-btn {
      background: #dc2626;
      color: #fff;
      border: none;
      padding: 10px 26px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: .5px;
      box-shadow: 0 4px 14px -2px rgba(220, 38, 38, .5);
      transition: background .25s, transform .25s;
    }

    .primary-btn:hover {
      background: #b91c1c;
    }

    .primary-btn:active {
      transform: translateY(1px);
    }

    dialog::backdrop {
      background: rgba(17, 24, 39, .55);
      -webkit-backdrop-filter: blur(3px);
      backdrop-filter: blur(3px);
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
        <div class="login-badge">
          <span>One CNSC, One Goal</span>
        </div>

        <form class="login-card" onsubmit="handleLogin(event)">
          <div class="login-header">
            <h2 id="welcomeHeading">Welcome</h2>
            <div class="login-subtitle" id="welcomeSub">Sign in to access your account</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input class="form-input" id="email" name="email" type="email" placeholder="cnsc.spmo@edu.ph" required />
          </div>

          <div class="form-group">
            <label class="form-label">Security PIN</label>
            <div class="otp-container" id="otp">
              <input type="password" inputmode="numeric" maxlength="1" aria-label="Digit 1">
              <input type="password" inputmode="numeric" maxlength="1" aria-label="Digit 2">
              <input type="password" inputmode="numeric" maxlength="1" aria-label="Digit 3">
              <input type="password" inputmode="numeric" maxlength="1" aria-label="Digit 4">
              <input type="password" inputmode="numeric" maxlength="1" aria-label="Digit 5">
              <input type="password" inputmode="numeric" maxlength="1" aria-label="Digit 6">
            </div>
          </div>

          <div class="form-extras">
            <a href="#" class="forgot-link">Forgot your PIN?</a>
          </div>

          <input type="hidden" name="credentials" id="hiddenPin" />

          <button class="login-btn" type="submit">
            <span class="btn-text">Sign In</span>
            <span class="btn-icon">→</span>
          </button>
        </form>
      </div>
    </div>
  </main>

  <script>
    // Lightweight showAlert fallback for standalone pages
    function showAlert(message, type = 'info', duration = 3500) {
      try {
        let container = document.getElementById('ui-alert-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'ui-alert-container';
          document.body.appendChild(container);
        }
        const el = document.createElement('div');
        el.className = `ui-alert ui-alert-${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => { el.remove(); }, duration);
      } catch (e) { alert(message); }
    }

    function getCsrfToken() {
      const tokenMeta = document.querySelector('meta[name="csrf-token"]');
      return tokenMeta ? tokenMeta.getAttribute('content') : '';
    }

    // Determine if user is returning (has a prior login log)
    function isReturningUser(email) {
      if (!email) return false;
      try {
        const logsRaw = localStorage.getItem('spmo_userLogs');
        if (!logsRaw) return false;
        const logs = JSON.parse(logsRaw);
        return Array.isArray(logs) && logs.some(l => (l.email || '').toLowerCase() === email.toLowerCase() && l.action === 'Login');
      } catch (e) { return false; }
    }

    // Update welcome heading dynamically
    const welcomeHeading = document.getElementById('welcomeHeading');
    const welcomeSub = document.getElementById('welcomeSub');
    function updateWelcomeHeading() {
      const emailVal = (emailInput.value || '').trim().toLowerCase();
      if (!emailVal) {
        welcomeHeading.textContent = 'Welcome';
        welcomeSub.textContent = 'Sign in to access your account';
        return;
      }
      if (isReturningUser(emailVal)) {
        welcomeHeading.textContent = 'Welcome Back';
        welcomeSub.textContent = 'Good to see you again';
      } else {
        welcomeHeading.textContent = 'Welcome';
        welcomeSub.textContent = 'Let\'s get you started';
      }
    }

    // OTP / PIN behavior (Updated for new class names)
    const otpInputs = Array.from(document.querySelectorAll('.otp-container input'));
    const hiddenPin = document.getElementById('hiddenPin');
    const emailInput = document.getElementById('email');

    const setHidden = () => hiddenPin.value = otpInputs.map(i => i.value).join('');

    otpInputs.forEach((input, idx) => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
        if (input.value && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
        setHidden();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) otpInputs[idx - 1].focus();
        if (e.key === 'ArrowLeft' && idx > 0) otpInputs[idx - 1].focus();
        if (e.key === 'ArrowRight' && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, otpInputs.length).split('');
        otpInputs.forEach((box, i) => box.value = digits[i] || '');
        const next = digits.length >= otpInputs.length ? otpInputs[otpInputs.length - 1] : otpInputs[digits.length] || otpInputs[0];
        next.focus(); setHidden();
      });
    });

    function handleLogin(event) {
      // Prevent the form from doing a traditional page reload submission
      event.preventDefault();

      const userEmail = emailInput.value;
      const userPin = hiddenPin.value;

      // Basic validation: Check if all 6 PIN digits are entered
      if (userPin.length !== 6) {
        // Show modal alert dialog (fallbacks to native alert if not supported)
        showAlertDialog("Please enter all 6 digits of your credentials.");
        otpInputs[0].focus(); // Focus on the first PIN box
        return; // Stop the login process
      }

      // Update heading in case email just completed
      updateWelcomeHeading();

      // --- In a real application, you would send userEmail and userPin to a server here ---
      // Show a modal dialog that confirms the attempted login instead of logging to the console
      showLoginDialog(userEmail, userPin);
    }
  </script>
  <!-- Login confirmation dialog -->
  <dialog id="loginDialog" class="login-dialog">
    <form method="dialog">
      <h3>Confirm Sign in</h3>
      <p id="dialogText">Checking...</p>
      <menu>
        <button id="cancelBtn" type="submit" value="cancel">Cancel</button>
        <button id="confirmBtn" type="submit" value="confirm">Continue</button>
      </menu>
    </form>
  </dialog>

  <!-- Simple alert dialog used for validation messages -->
  <dialog id="alertDialog" class="login-dialog" aria-live="polite">
    <form method="dialog">
      <h3>Attention</h3>
      <p id="alertText">Message</p>
      <menu>
        <button id="alertOk" type="submit" value="ok">OK</button>
      </menu>
    </form>
  </dialog>

  <!-- Loading dialog (modal, non-dismissible) -->
  <dialog id="loadingDialog" class="loading-dialog" aria-live="assertive" aria-label="Authenticating" data-no-close>
    <div class="loading-spinner" role="status" aria-label="Loading"></div>
    <div class="loading-text">Authenticating your credentials...</div>
  </dialog>

  <!-- Success dialog -->
  <dialog id="successDialog" class="success-dialog" aria-live="polite" aria-label="Login Successful">
    <form method="dialog">
      <div class="success-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3>Signed In</h3>
      <p id="successText">Welcome back! Redirecting to your dashboard.</p>
      <menu>
        <button id="successContinue" class="primary-btn" value="ok" type="submit">Continue</button>
      </menu>
    </form>
  </dialog>

  <script>
    // Mask the PIN for display (show only last 2 digits)
    function maskPin(pin) {
      if (!pin) return '';
      if (pin.length <= 2) return '*'.repeat(pin.length);
      return '*'.repeat(pin.length - 2) + pin.slice(-2);
    }

    // Update user status in MockData (localStorage only for this standalone page)
    function updateUserStatus(email, status) {
      try {
        let users = [];
        try {
          const stored = localStorage.getItem('mockDataUsers');
          if (stored) users = JSON.parse(stored);
        } catch (e) {
          console.warn('Could not load existing users:', e);
        }
        const user = users.find(u => u.email === email);
        if (user) {
          user.status = status;
          localStorage.setItem('mockDataUsers', JSON.stringify(users));
        }
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }

  function logUserLogin(email, status = 'Success', profile = null) {
      try {
        // Update user status to Active on successful login
        if (status === 'Success') {
          updateUserStatus(email, 'Active');
        }

        // Get or initialize userLogs from localStorage
        let userLogs = [];
        try {
          const stored = localStorage.getItem('spmo_userLogs');
          if (stored) {
            userLogs = JSON.parse(stored);
          }
        } catch (e) {
          console.warn('Could not load existing logs:', e);
        }

        // Generate unique log ID
        const logId = 'LOG' + String(userLogs.length + 1).padStart(3, '0');

        // Get current timestamp
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

  const name = profile?.name || extractNameFromEmail(email);

        // Detect device info
        const userAgent = navigator.userAgent;
        let device = 'Unknown Device';
        if (userAgent.indexOf('Windows') !== -1) device = 'Windows PC';
        else if (userAgent.indexOf('Mac') !== -1) device = 'MacBook';
        else if (userAgent.indexOf('Linux') !== -1) device = 'Linux PC';
        else if (userAgent.indexOf('Android') !== -1) device = 'Android Device';
        else if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) device = 'iOS Device';

        // Create log entry
        const logEntry = {
          id: logId,
          email: email,
          name: name,
          action: 'Login',
          timestamp: timestamp,
          ipAddress: 'N/A',
          device: device,
          status: status
        };

        // Add to beginning of logs array (newest first)
        userLogs.unshift(logEntry);

        // Keep only last 100 logs
        if (userLogs.length > 100) {
          userLogs = userLogs.slice(0, 100);
        }

        // Save to localStorage
        localStorage.setItem('spmo_userLogs', JSON.stringify(userLogs));
        console.log('User login logged:', logEntry);
      } catch (error) {
        console.error('Error logging user login:', error);
      }
    }

    function showLoginDialog(email, pin) {
      const dialog = document.getElementById('loginDialog');
      const text = document.getElementById('dialogText');
      const masked = maskPin(pin);
      text.textContent = `Sign in as ${email} with PIN ${masked}?`;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
        function onClose() {
          const val = dialog.returnValue;
          dialog.removeEventListener('close', onClose);
          if (val === 'confirm') {
            startAuthentication(email, pin);
          } else {
            otpInputs[0].focus();
          }
        }
        dialog.addEventListener('close', onClose);
      } else {
        const ok = confirm(`Sign in as ${email} with PIN ${masked}?`);
        if (ok) startAuthentication(email, pin, true); else otpInputs[0].focus();
      }
    }

    // Authentication workflow with loading & success dialogs
    async function startAuthentication(email, pin, fallback = false) {
      const loading = document.getElementById('loadingDialog');
      const success = document.getElementById('successDialog');

      if (!fallback && loading && typeof loading.showModal === 'function') {
        loading.showModal();
        loading.addEventListener('cancel', ev => ev.preventDefault(), { once: true });
      }

      try {
        const response = await fetch(window.APP_ROUTES?.loginSubmit || window.APP_ROUTES?.login || '/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify({ email, pin })
        });

        const data = await response.json().catch(() => ({ message: 'Unexpected server response.' }));

        if (!response.ok) {
          throw new Error(data?.message || 'Authentication failed.');
        }

        const redirectTarget = data?.redirect || window.APP_ROUTES?.dashboard || '/admin/dashboard';

        try {
          saveUserSession(email, data?.user);
          logUserLogin(email, 'Success', data?.user);
        } catch (logError) {
          console.error('Session logging error', logError);
        }

        if (!fallback && success && typeof success.showModal === 'function') {
          const successText = document.getElementById('successText');
          if (successText) {
            successText.textContent = isReturningUser(email) ? 'Welcome back! Redirecting to your dashboard.' : 'Welcome! Redirecting to your dashboard.';
          }
          success.showModal();
          setTimeout(() => {
            if (success.open) success.close();
            redirectToDashboard(redirectTarget);
          }, 1800);
        } else {
          alert((isReturningUser(email) ? 'Welcome back' : 'Welcome') + '! Redirecting to dashboard...');
          redirectToDashboard(redirectTarget);
        }
      } catch (error) {
        console.error('Authentication error', error);
        showAlertDialog(error.message || 'Unable to authenticate. Please verify your credentials.');
      } finally {
        if (loading && loading.open) loading.close();
      }
    }

    function redirectToDashboard(target) {
      const fallback = window.APP_ROUTES?.dashboard || '/admin/dashboard';
      window.location.href = target || fallback;
    }

    // Success dialog close -> redirect safeguard
    (function attachSuccessHandler() {
      const success = document.getElementById('successDialog');
      if (!success) return;
      success.addEventListener('close', () => {
        redirectToDashboard();
      });
    })();

    // Save user session to localStorage
    function saveUserSession(email, profile = null) {
      try {
        // Get users from localStorage to find matching user
        let users = [];
        try {
          const stored = localStorage.getItem('mockDataUsers');
          if (stored) {
            users = JSON.parse(stored);
          }
        } catch (e) {
          console.warn('Could not load users:', e);
        }

        // Find user by email
        const user = users.find(u => u.email === email);

        const source = profile || user || {};

        // Create session data
        const sessionData = {
          email: source.email || email,
          name: source.name || extractNameFromEmail(email),
          role: source.role || 'User',
          department: source.department || 'N/A',
          id: source.id || 'GUEST',
          loginTime: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        console.log('User session saved:', sessionData);
      } catch (error) {
        console.error('Error saving user session:', error);
      }
    }

    // Extract name from email
    function extractNameFromEmail(email) {
      const namePart = email.split('@')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/\./g, ' ');
    }

    // Show a simple alert dialog. Uses <dialog> if available, otherwise window.alert
    function showAlertDialog(message) {
      const ad = document.getElementById('alertDialog');
      const text = document.getElementById('alertText');
      text.textContent = message;
      if (typeof ad.showModal === 'function') {
        ad.showModal();
        // focus OK button for accessibility
        const ok = document.getElementById('alertOk');
        ok.focus();
        ad.addEventListener('close', function onClose() {
          ad.removeEventListener('close', onClose);
        });
      } else {
        alert(message);
      }
    }

    // Attach dynamic heading listeners
    document.addEventListener('DOMContentLoaded', () => {
      updateWelcomeHeading();
      emailInput.addEventListener('input', updateWelcomeHeading);
      emailInput.addEventListener('blur', updateWelcomeHeading);
    });
  </script>
</body>

</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/access-system.blade.php ENDPATH**/ ?>