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
  window.APP_ROUTES.inspectionAcceptanceReportView = "<?php echo e(url('/inspection-acceptance-report/view/{id}')); ?>";
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

    /* Enhanced Alert Styles */
    .ui-alert {
      padding: 16px 20px;
      border-radius: 12px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    }

    .ui-alert-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .ui-alert-error {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .ui-alert-warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .ui-alert-info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .ui-alert:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .ui-alert button:hover {
      opacity: 1 !important;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    @media (max-width: 480px) {
      #ui-alert-container {
        left: 10px !important;
        right: 10px !important;
        max-width: none !important;
      }

      .ui-alert {
        padding: 12px 16px;
        font-size: 13px;
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
            <label class="form-label">Password</label>
            <input class="form-input" id="password" name="password" type="password" placeholder="Enter your password" required />
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
    // Enhanced showAlert function with icons and animations
    function showAlert(message, type = 'info', duration = 3500) {
      try {
        // Ensure Lucide icons are loaded
        if (!document.querySelector('script[src*="lucide"]')) {
          const lucideScript = document.createElement('script');
          lucideScript.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.js';
          document.head.appendChild(lucideScript);
          lucideScript.onload = () => lucide.createIcons();
        }

        let container = document.getElementById('ui-alert-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'ui-alert-container';
          container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            pointer-events: none;
          `;
          document.body.appendChild(container);
        }

        const alertEl = document.createElement('div');
        alertEl.className = `ui-alert ui-alert-${type}`;
        alertEl.style.cssText = `
          margin-bottom: 10px;
          pointer-events: auto;
          cursor: pointer;
          animation: slideInRight 0.3s ease-out;
        `;

        // Icon mapping
        const icons = {
          success: 'check-circle',
          error: 'x-circle',
          warning: 'alert-triangle',
          info: 'info'
        };

        const iconName = icons[type] || 'info';

        alertEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <i data-lucide="${iconName}" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
            <div style="flex: 1; font-size: 14px; line-height: 1.4;">${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" style="
              background: none;
              border: none;
              color: inherit;
              cursor: pointer;
              padding: 2px;
              opacity: 0.7;
              font-size: 18px;
              line-height: 1;
            ">&times;</button>
          </div>
          <div style="height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden; margin-top: 8px;">
            <div style="height: 100%; background: rgba(255,255,255,0.8); border-radius: 2px; width: 100%; animation: progress ${duration}ms linear;"></div>
          </div>
        `;

        container.appendChild(alertEl);

        // Trigger icon creation if Lucide is loaded
        if (window.lucide) {
          lucide.createIcons();
        }

        // Auto remove after duration
        setTimeout(() => {
          if (alertEl.parentElement) {
            alertEl.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => alertEl.remove(), 300);
          }
        }, duration);

        // Click to dismiss
        alertEl.addEventListener('click', () => {
          alertEl.style.animation = 'slideOutRight 0.3s ease-in forwards';
          setTimeout(() => alertEl.remove(), 300);
        });

      } catch (e) {
        // Fallback to native alert
        alert(message);
      }
    }

    function getCsrfToken() {
      const tokenMeta = document.querySelector('meta[name="csrf-token"]');
      return tokenMeta ? tokenMeta.getAttribute('content') : '';
    }

    // Determine if user is returning (has a prior login log)
    function isReturningUser(email) {
      return false;
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

    // Password field
    const passwordInput = document.getElementById('password');
    const hiddenPin = document.getElementById('hiddenPin');
    const emailInput = document.getElementById('email');

    function handleLogin(event) {
      // Prevent the form from doing a traditional page reload submission
      event.preventDefault();

      const userEmail = emailInput.value;
      const userPassword = passwordInput.value;

      // Basic validation: Check if password is entered
      if (!userPassword || userPassword.length < 8) {
        showAlertDialog("Please enter your password (minimum 8 characters).");
        passwordInput.focus();
        return;
      }

      // Update heading in case email just completed
      updateWelcomeHeading();

      // Set hidden field for compatibility
      hiddenPin.value = userPassword;

      // Show login confirmation
      showLoginDialog(userEmail, userPassword);
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
      // Removed localStorage usage
    }

  function logUserLogin(email, status = 'Success', profile = null) {
      try {
        // Update user status to Active on successful login
        if (status === 'Success') {
          updateUserStatus(email, 'Active');
        }

        // Removed localStorage logging
        console.log('User login logged:', { email, status });
      } catch (error) {
        console.error('Error logging user login:', error);
      }
    }

    function showLoginDialog(email, password) {
      const dialog = document.getElementById('loginDialog');
      const text = document.getElementById('dialogText');
      const masked = '*'.repeat(Math.min(password.length, 8));
      text.textContent = `Sign in as ${email} with password ${masked}?`;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
        function onClose() {
          const val = dialog.returnValue;
          dialog.removeEventListener('close', onClose);
          if (val === 'confirm') {
            startAuthentication(email, password);
          } else {
            passwordInput.focus();
          }
        }
        dialog.addEventListener('close', onClose);
      } else {
        const ok = confirm(`Sign in as ${email} with password ${masked}?`);
        if (ok) startAuthentication(email, password, true); else passwordInput.focus();
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
        const source = profile || {};

        // Create session data
        const sessionData = {
          email: source.email || email,
          name: source.name || extractNameFromEmail(email),
          role: source.role || 'User',
          department: source.department || 'N/A',
          id: source.id || 'GUEST',
          loginTime: new Date().toISOString()
        };

        // Removed localStorage save
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