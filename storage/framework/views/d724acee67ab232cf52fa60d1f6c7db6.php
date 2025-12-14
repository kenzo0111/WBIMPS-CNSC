<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="shortcut icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
  <link rel="icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
  <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>" />
  <title>Forgot Password - SPMO Access System</title>
  <?php echo app('Illuminate\Foundation\Vite')('resources/css/AccessSystem.css'); ?>
  <style>
    /* Additional styles for forgot password page */
    .forgot-header {
      text-align: center;
      margin-bottom: 32px;
      animation: fadeInUp 0.8s ease-out;
    }

    .forgot-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.1);
      animation: pulse 3s infinite ease-in-out;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }

    .forgot-icon svg {
      width: 40px;
      height: 40px;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    .forgot-header h2 {
      margin: 0 0 12px;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .forgot-header p {
      margin: 0;
      font-size: 15px;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      max-width: 90%;
      margin-left: auto;
      margin-right: auto;
    }

    .back-to-login {
      text-align: center;
      margin-top: 24px;
      animation: fadeInUp 0.8s ease-out 0.6s both;
    }

    .back-to-login a {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .back-to-login a:hover {
      color: #ffffff;
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      transform: translateX(-4px);
    }

    /* Dialog Styles */
    dialog.loading-dialog,
    dialog.success-dialog {
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(20, 20, 20, 0.85);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      color: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      font-family: system-ui, sans-serif;
    }

    dialog[open] {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      margin: 0;
      max-width: 460px;
      width: calc(100% - 40px);
      animation: dialogFadeIn 0.3s ease-out;
    }

    @keyframes dialogFadeIn {
      from { opacity: 0; transform: translate(-50%, -40%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }

    dialog.loading-dialog {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
      text-align: center;
    }

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #dc2626;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 16px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 0.5px;
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
      margin: 0 auto 16px;
      box-shadow: 0 0 20px rgba(22, 163, 74, 0.4);
    }

    .success-icon svg {
      width: 38px;
      height: 38px;
      color: #fff;
    }

    dialog.success-dialog h3 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }

    dialog.success-dialog p {
      margin: 0 0 24px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 15px;
      line-height: 1.5;
    }

    dialog.success-dialog menu {
      display: flex;
      justify-content: center;
      padding: 0;
      margin: 0;
    }

    .primary-btn {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: #fff;
      border: none;
      padding: 12px 32px;
      border-radius: 999px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
      transition: all 0.3s ease;
    }

    .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(220, 38, 38, 0.5);
    }

    .primary-btn:active {
      transform: translateY(1px);
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
    }

    .error-message {
      background: rgba(254, 226, 226, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 14px;
      margin-bottom: 24px;
      display: none;
      backdrop-filter: blur(5px);
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    .error-message.show {
      display: block;
    }
  </style>
</head>

<body>
  <header>
    <div class="header-container">
      <div class="logo">
        <img src="<?php echo e(asset('images/cnscrefine.png')); ?>" alt="CNSC Logo" />
        <div class="logo-text">
          <h1>Supply and Property Management Office</h1>
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
          <span>Password Recovery</span>
        </div>

        <form class="login-card" onsubmit="handleForgotPassword(event)">
          <div class="forgot-header">
            <div class="forgot-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>Forgot Password?</h2>
            <p>No worries! Enter your email address and we'll send you a link to reset your password.</p>
          </div>

          <div id="errorMessage" class="error-message"></div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input class="form-input" id="email" name="email" type="email" placeholder="Enter your registered email" required />
          </div>

          <button class="login-btn" type="submit">
            <span class="btn-text">Send Reset Link</span>
            <span class="btn-icon">→</span>
          </button>

          <div class="back-to-login">
            <a href="<?php echo e(route('login')); ?>">← Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  </main>

  <!-- Loading dialog -->
  <dialog id="loadingDialog" class="loading-dialog">
    <div class="loading-spinner"></div>
    <div class="loading-text">Sending reset link...</div>
  </dialog>

  <!-- Success dialog -->
  <dialog id="successDialog" class="success-dialog">
    <form method="dialog">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h3>Email Sent!</h3>
      <p id="successText">We've sent a password reset link to your email address. Please check your inbox.</p>
      <menu>
        <button class="primary-btn" value="ok" type="submit" onclick="window.location.href='<?php echo e(route('login')); ?>'">
          Back to Login
        </button>
      </menu>
    </form>
  </dialog>

  <script>
    function getCsrfToken() {
      const tokenMeta = document.querySelector('meta[name="csrf-token"]');
      return tokenMeta ? tokenMeta.getAttribute('content') : '';
    }

    function showError(message) {
      const errorDiv = document.getElementById('errorMessage');
      errorDiv.textContent = message;
      errorDiv.classList.add('show');
      
      setTimeout(() => {
        errorDiv.classList.remove('show');
      }, 5000);
    }

    async function handleForgotPassword(event) {
      event.preventDefault();

      const emailInput = document.getElementById('email');
      const email = emailInput.value.trim();

      if (!email) {
        showError('Please enter your email address.');
        return;
      }

      const loading = document.getElementById('loadingDialog');
      const success = document.getElementById('successDialog');
      const successText = document.getElementById('successText');

      try {
        loading.showModal();
        loading.addEventListener('cancel', ev => ev.preventDefault(), { once: true });

        const response = await fetch('<?php echo e(route('password.reset.send')); ?>', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (loading.open) loading.close();

        if (!response.ok) {
          showError(data.message || 'Failed to send reset link. Please try again.');
          return;
        }

        successText.textContent = data.message || 'We\'ve sent a password reset link to your email address. Please check your inbox.';
        success.showModal();

      } catch (error) {
        if (loading.open) loading.close();
        console.error('Error:', error);
        showError('An error occurred. Please try again later.');
      }
    }
  </script>
</body>

</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/forgot-password.blade.php ENDPATH**/ ?>