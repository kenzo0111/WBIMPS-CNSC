<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="shortcut icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
  <link rel="icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
  <meta name="csrf-token" content="{{ csrf_token() }}" />
  <title>Reset Password - SPMO Access System</title>
  @vite(['resources/css/index.css', 'resources/css/AccessSystem.css', 'resources/css/access-system-overrides.css'])
  <style>
    /* Additional styles for reset password page */
    .reset-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .reset-icon {
      width: 70px;
      height: 70px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #16a34a, #15803d);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
    }

    .reset-icon svg {
      width: 36px;
      height: 36px;
      color: white;
    }

    .reset-header h2 {
      margin: 0 0 8px;
      font-size: 26px;
      font-weight: 700;
      color: #111827;
    }

    .reset-header p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }

    .password-requirements {
      background: #f9fafb;
      border-left: 4px solid #dc2626;
      padding: 12px 16px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-size: 13px;
      color: #4b5563;
    }

    .password-requirements ul {
      margin: 8px 0 0;
      padding-left: 20px;
    }

    .password-requirements li {
      margin: 4px 0;
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

    .user-email {
      background: #f3f4f6;
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      text-align: center;
      font-size: 14px;
      color: #374151;
      font-weight: 500;
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
          <span>Create New Password</span>
        </div>

        <form class="login-card" onsubmit="handleResetPassword(event)">
          <div class="reset-header">
            <div class="reset-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M9 12l2 2 4-4"></path>
              </svg>
            </div>
            <h2>Reset Your Password</h2>
            <p>Enter your new password below. Make sure it's strong and secure.</p>
          </div>

          <div class="user-email">
            Resetting password for: <strong>{{ $email }}</strong>
          </div>

          <div id="errorMessage" class="error-message"></div>

          <div class="password-requirements">
            <strong>Password Requirements:</strong>
            <ul>
              <li>Minimum 8 characters long</li>
              <li>Both passwords must match</li>
            </ul>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">New Password</label>
            <input class="form-input" id="password" name="password" type="password" placeholder="Enter new password" required minlength="8" />
          </div>

          <div class="form-group">
            <label class="form-label" for="password_confirmation">Confirm Password</label>
            <input class="form-input" id="password_confirmation" name="password_confirmation" type="password" placeholder="Re-enter new password" required minlength="8" />
          </div>

          <input type="hidden" name="token" id="token" value="{{ $token }}" />

          <button class="login-btn" type="submit">
            <span class="btn-text">Reset Password</span>
            <span class="btn-icon">✓</span>
          </button>
        </form>
      </div>
    </div>
  </main>

  <!-- Loading dialog -->
  <dialog id="loadingDialog" class="loading-dialog">
    <div class="loading-spinner"></div>
    <div class="loading-text">Resetting your password...</div>
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
      <h3>Password Reset!</h3>
      <p>Your password has been reset successfully. You can now login with your new password.</p>
      <menu>
        <button class="primary-btn" value="ok" type="submit" onclick="window.location.href='{{ route('login') }}'">
          Go to Login
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

    async function handleResetPassword(event) {
      event.preventDefault();

      const passwordInput = document.getElementById('password');
      const confirmInput = document.getElementById('password_confirmation');
      const tokenInput = document.getElementById('token');

      const password = passwordInput.value;
      const passwordConfirmation = confirmInput.value;
      const token = tokenInput.value;

      // Client-side validation
      if (password.length < 8) {
        showError('Password must be at least 8 characters long.');
        passwordInput.focus();
        return;
      }

      if (password !== passwordConfirmation) {
        showError('Passwords do not match. Please try again.');
        confirmInput.focus();
        return;
      }

      const loading = document.getElementById('loadingDialog');
      const success = document.getElementById('successDialog');

      try {
        loading.showModal();
        loading.addEventListener('cancel', ev => ev.preventDefault(), { once: true });

        const response = await fetch('{{ route('password.reset.update') }}', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify({
            token,
            password,
            password_confirmation: passwordConfirmation
          })
        });

        const data = await response.json();

        if (loading.open) loading.close();

        if (!response.ok) {
          showError(data.message || 'Failed to reset password. Please try again.');
          return;
        }

        success.showModal();

        // Auto redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '{{ route('login') }}';
        }, 2000);

      } catch (error) {
        if (loading.open) loading.close();
        console.error('Error:', error);
        showError('An error occurred. Please try again later.');
      }
    }
  </script>
</body>

</html>
