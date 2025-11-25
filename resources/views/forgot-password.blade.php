<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="shortcut icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
  <link rel="icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
  <meta name="csrf-token" content="{{ csrf_token() }}" />
  <title>Forgot Password - SPMO Access System</title>
  @vite('resources/css/AccessSystem.css')
  <style>
    /* Additional styles for forgot password page */
    .forgot-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .forgot-icon {
      width: 70px;
      height: 70px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3);
    }

    .forgot-icon svg {
      width: 36px;
      height: 36px;
      color: white;
    }

    .forgot-header h2 {
      margin: 0 0 8px;
      font-size: 26px;
      font-weight: 700;
      color: #111827;
    }

    .forgot-header p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }

    .back-to-login {
      text-align: center;
      margin-top: 20px;
    }

    .back-to-login a {
      color: #dc2626;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.3s;
    }

    .back-to-login a:hover {
      color: #b91c1c;
      text-decoration: underline;
    }

    dialog.loading-dialog,
    dialog.success-dialog {
      border: none;
      border-radius: 14px;
      padding: 32px 40px;
      box-shadow: 0 10px 40px -5px rgba(0, 0, 0, .25);
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
      backdrop-filter: blur(3px);
    }

    .error-message {
      background: #fee2e2;
      color: #991b1b;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 20px;
      display: none;
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
        <img src="{{ asset('images/cnscrefine.png') }}" alt="CNSC Logo" />
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
            <a href="{{ route('login') }}">← Back to Login</a>
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
        <button class="primary-btn" value="ok" type="submit" onclick="window.location.href='{{ route('login') }}'">
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

        const response = await fetch('{{ route('password.reset.send') }}', {
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
