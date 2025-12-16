<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="shortcut icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
  <link rel="icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
  <meta name="csrf-token" content="{{ csrf_token() }}" />
  <title>Forgot Password - SPMO Access System</title>
  @vite(['resources/css/index.css', 'resources/css/AccessSystem.css', 'resources/css/access-system-overrides.css'])
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
        <img src="{{ asset('images/cnscrefine.png') }}" alt="CNSC Logo" />
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
