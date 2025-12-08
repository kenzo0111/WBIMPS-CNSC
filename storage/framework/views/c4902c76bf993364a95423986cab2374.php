<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="shortcut icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
  <link rel="icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
  <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>" />
  <title>Supply and Property Management System</title>
  <?php echo app('Illuminate\Foundation\Vite')(['resources/css/index.css', 'resources/css/AccessSystem.css', 'resources/css/access-system-overrides.css']); ?>
  <script>
    window.APP_ROUTES = window.APP_ROUTES || {};
    window.APP_ROUTES.login = "<?php echo e(route('login')); ?>";
    window.APP_ROUTES.loginSubmit = "<?php echo e(route('login.perform')); ?>";
    window.APP_ROUTES.dashboard = "<?php echo e(route('admin.dashboard')); ?>";
    // Add activity endpoints so Access page can create server-side activity logs
    window.APP_ROUTES.activities = "<?php echo e(url('/api/activities')); ?>";
    window.APP_ROUTES.userLogs = "<?php echo e(url('/api/user-logs')); ?>";
    // Patterns for client-side route generation
    window.APP_ROUTES.purchaseOrderView = "<?php echo e(url('/purchase-order/view/{id}')); ?>";
    window.APP_ROUTES.purchaseRequestView = "<?php echo e(url('/purchase-request/view/{id}')); ?>";
    window.APP_ROUTES.inventoryCustodianSlipView = "<?php echo e(url('/inventory-custodian-slip/view/{id}')); ?>";
    window.APP_ROUTES.inspectionAcceptanceReportView = "<?php echo e(url('/inspection-acceptance-report/view/{id}')); ?>";
  </script>
</head>

<body>
  <!-- Header -->
  <header>
    <div class="header-container">
      <div class="logo">
        <img src="<?php echo e($imagesPath); ?>/cnscrefine.png" alt="School Logo">
        <div class="logo-text">
          <h1>Supply and Property Management Office</h1>
          <hr>
          <p>WEB - BASED SUPPLY AND PROPERTY MANAGEMENT SYSTEM</p>
        </div>
      </div>
      <nav class="nav-menu">
        <a href="<?php echo e(route('contact.support')); ?>" class="support-btn">
          <span class="btn-icon">📞</span>
          Contact Support
        </a>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-overlay"></div>
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-badge">
          <span>One CNSC, One Goal</span>
        </div>
        <h2 class="hero-title">
          <span class="title-line">
            <span class="red">Supply</span> & <span class="yellow">Property</span>
          </span>
          <span class="title-line">Management System</span>
        </h2>
        <p class="hero-description">
          Streamline your institutional operations with our comprehensive supply and property
          management system designed specifically for Camarines Norte State College.
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">Digital</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">24/7</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">Secure</span>
            <span class="stat-label">Platform</span>
          </div>
        </div>
      </div>

      <!-- Login Form -->
      <div class="login-wrapper">
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
            <a href="<?php echo e(route('password.forgot')); ?>" class="forgot-link">Forgot your Password?</a>
          </div>

          <input type="hidden" name="credentials" id="hiddenPassword" />

          <button class="login-btn" type="submit">
            <span class="btn-text">Sign In</span>
            <span class="btn-icon">→</span>
          </button>
        </form>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <p>&copy; 2025 Camarines Norte State College. All rights reserved.</p>
  </footer>

  <!-- Login confirmation dialog -->
  <dialog id="loginDialog" class="login-dialog modern-dialog">
    <form method="dialog" class="dialog-form">
      <div class="dialog-icon-wrapper success">
        <svg class="dialog-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <h3 class="dialog-title">Confirm Sign In</h3>
      <p id="dialogText" class="dialog-message">Checking...</p>
      <menu class="dialog-actions">
        <button id="cancelBtn" class="dialog-btn dialog-btn-cancel" type="submit" value="cancel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Cancel
        </button>
        <button id="confirmBtn" class="dialog-btn dialog-btn-confirm" type="submit" value="confirm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Continue
        </button>
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
    const hiddenPassword = document.getElementById('hiddenPassword');
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
      hiddenPassword.value = userPassword;

      // Show login confirmation
      showLoginDialog(userEmail, userPassword);
    }

    // Mask the password for display (show only last 2 digits)
    function maskPassword(password) {
      if (!password) return '';
      if (password.length <= 2) return '*'.repeat(password.length);
      return '*'.repeat(password.length - 2) + password.slice(-2);
    }

    // Update user status in MockData (localStorage only for this standalone page)
    function updateUserStatus(email, status) {
      // Removed localStorage usage
    }

  async function logUserLogin(email, status = 'Success', profile = null) {
      try {
        // Update user status to Active on successful login
        if (status === 'Success') {
          updateUserStatus(email, 'Active');
        }

        // Try persisting to server: legacy user-logs and spatie activity log
        try {
          // Send a legacy user log for compatibility
          await fetch((window.APP_ROUTES && window.APP_ROUTES.userLogs) || '/api/user-logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({
              email: email,
              name: profile?.name || email,
              action: 'Login',
              timestamp: new Date().toISOString(),
              ip_address: null,
              device: navigator.userAgent,
              status: status,
            }),
          }).catch((e) => console.warn('userLogs POST failed', e))

          // Also create a Spatie activity record (used by dashboard recent activity)
          await fetch((window.APP_ROUTES && window.APP_ROUTES.activities) || '/api/activities', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({
              action: 'Login',
              meta: { email: email, device: navigator.userAgent, status: status },
            }),
          }).catch((e) => console.warn('activities POST failed', e))
        } catch (e) {
          console.warn('Failed to persist login activity', e)
        }

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

    // Global variable to store the intended redirect URL
    let intendedRedirectUrl = null;

    // Authentication workflow with loading & success dialogs
    async function startAuthentication(email, password, fallback = false) {
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
          body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => ({ message: 'Unexpected server response.' }));

        if (!response.ok) {
          throw new Error(data?.message || 'Authentication failed.');
        }

        const redirectTarget = data?.redirect || window.APP_ROUTES?.dashboard || '/admin/dashboard';
        intendedRedirectUrl = redirectTarget;

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
            // The close event listener will handle the redirect using intendedRedirectUrl
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
      window.location.href = target || intendedRedirectUrl || fallback;
    }

    // Success dialog close -> redirect safeguard
    (function attachSuccessHandler() {
      const success = document.getElementById('successDialog');
      if (!success) return;
      success.addEventListener('close', () => {
        redirectToDashboard(intendedRedirectUrl);
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