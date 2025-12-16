<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="shortcut icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
  <link rel="icon" href="<?php echo e(asset('images/UCN1.png')); ?>" type="image/png">
  <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>" />
  <title>Reset Password - SPMO Access System</title>
  <?php echo app('Illuminate\Foundation\Vite')(['resources/css/index.css', 'resources/css/AccessSystem.css', 'resources/css/access-system-overrides.css']); ?>
  <style>
    /* System style from Forgot Password (applied to Reset page) */
    .reset-header {
      text-align: center;
      margin-bottom: 32px;
      animation: fadeInUp 0.8s ease-out;
    }

    .reset-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.08);
      animation: pulse 3s infinite ease-in-out;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }

    .reset-icon svg {
      width: 40px;
      height: 40px;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    .reset-header h2 {
      margin: 0 0 12px;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .reset-header p {
      margin: 0;
      font-size: 15px;
      color: rgba(255, 255, 255, 0.85);
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
      color: rgba(255, 255, 255, 0.78);
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
      background: rgba(254, 226, 226, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.26);
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

    .error-message.show { display: block; }

    .password-requirements {
      display:flex;
      gap:12px;
      align-items:flex-start;
      background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
      border-left: 4px solid #ffb3b8;
      padding: 12px 14px;
      margin-bottom: 20px;
      border-radius: 8px;
      font-size: 13px;
      color: rgba(255,255,255,0.92);
      box-shadow: 0 6px 20px rgba(2,6,23,0.03);
      backdrop-filter: blur(6px);
      transition: box-shadow .18s ease, border-left-color .18s ease;
    }

    .password-requirements.all-met { border-left-color: #34d399; box-shadow: 0 12px 40px rgba(16, 185, 129, 0.08); }

    .password-requirements .pr-icon {
      flex-shrink:0;
      width:40px;
      height:40px;
      display:flex;
      align-items:center;
      justify-content:center;
      background: rgba(220,38,38,0.10);
      border-radius:10px;
      color:#ff6b6b;
      font-weight:700;
      font-size:18px;
      transition: transform .2s ease, background .18s ease, box-shadow .18s ease;
    }

    .password-requirements .pr-icon svg { width:18px; height:18px; display:block; }

    .password-requirements .pr-icon.happy { background: rgba(16,185,129,0.12); color:#10b981; transform: scale(1.06); box-shadow: 0 10px 30px rgba(16,185,129,0.06); }

    .password-requirements .pr-content strong { display:block; margin-bottom:6px; color: #fff; font-size:14px; }

    .password-requirements ul { margin:0; padding-left:0; list-style:none; }

    .password-requirements li { display:flex; gap:10px; align-items:center; margin:6px 0; color: rgba(255,255,255,0.9); }

    .password-requirements .check { width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; border-radius:4px; border:1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-size:12px; background: rgba(255,255,255,0.02); transition: all .18s ease; }

    .password-requirements .requirement.met .check { background:#16a34a; border-color: rgba(16,163,74,0.85); color:#fff; box-shadow: 0 6px 18px rgba(16,163,74,0.08); }

    @keyframes popChk { 0%{ transform: scale(.92) } 50%{ transform: scale(1.12) } 100%{ transform: scale(1) } }
    .password-requirements .check.pop { animation: popChk .28s ease; }

    /* Screen-reader helper */
    .sr-only { position: absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

    @media (max-width:480px) { .password-requirements { flex-direction:row; align-items:flex-start; } .password-requirements .pr-icon{width:34px;height:34px;} }

    .user-email {
      background: transparent;
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      text-align: center;
      font-size: 14px;
      color: rgba(255,255,255,0.9);
      font-weight: 500;
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
            Resetting password for: <strong><?php echo e($email); ?></strong>
          </div>

          <div id="errorMessage" class="error-message"></div>

          <div class="password-requirements" aria-hidden="false">
            <div class="pr-icon" aria-hidden="true" role="img" aria-label="Password requirements">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6 6 .5-4.5 3 1.5 6L12 15l-6 3 1.5-6L3 8.5 9 8 12 2z"></path></svg>
            </div>
            <div class="pr-content">
              <strong>Password Requirements:</strong>
              <div id="prAnnouncer" class="sr-only" aria-live="polite"></div>
              <ul>
                <li class="requirement" data-rule="minLength"><span class="check" aria-hidden="true">○</span><span>Minimum 8 characters long</span></li>
                <li class="requirement" data-rule="match"><span class="check" aria-hidden="true">○</span><span>Both passwords must match</span></li>
              </ul>
            </div>
          </div> 

          <div class="form-group">
            <label class="form-label" for="password">New Password</label>
            <input class="form-input" id="password" name="password" type="password" placeholder="Enter new password" required minlength="8" />
          </div>

          <div class="form-group">
            <label class="form-label" for="password_confirmation">Confirm Password</label>
            <input class="form-input" id="password_confirmation" name="password_confirmation" type="password" placeholder="Re-enter new password" required minlength="8" />
          </div>

          <input type="hidden" name="token" id="token" value="<?php echo e($token); ?>" />

          <button class="login-btn" type="submit">
            <span class="btn-text">Reset Password</span>
            <span class="btn-icon">✓</span>
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
        <button class="primary-btn" value="ok" type="submit" onclick="window.location.href='<?php echo e(route('login')); ?>'">
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

        const response = await fetch('<?php echo e(route('password.reset.update')); ?>', {
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
          window.location.href = '<?php echo e(route('login')); ?>';
        }, 2000);

      } catch (error) {
        if (loading.open) loading.close();
        console.error('Error:', error);
        showError('An error occurred. Please try again later.');
      }
    }

    // Live validation for password requirements
    (function(){
      const pw = document.getElementById('password');
      const pwc = document.getElementById('password_confirmation');
      const reqMin = document.querySelector('.requirement[data-rule="minLength"]');
      const reqMatch = document.querySelector('.requirement[data-rule="match"]');

      function updateReqs(){
        const val = pw ? pw.value : '';
        const val2 = pwc ? pwc.value : '';
        const results = { min: false, match: false };

        function toggleRequirement(el, met, key){
          const chk = el.querySelector('.check');
          if(met){
            if(!el.classList.contains('met')){
              el.classList.add('met');
              chk.textContent = '✓';
              chk.classList.add('pop');
              setTimeout(()=>chk.classList.remove('pop'), 300);
              el.dataset.state = 'met';
            }
            results[key] = true;
          } else {
            if(el.classList.contains('met')){
              el.classList.remove('met');
              chk.textContent = '○';
              chk.classList.add('pop');
              setTimeout(()=>chk.classList.remove('pop'), 300);
            } else {
              chk.textContent = '○';
            }
            el.dataset.state = 'unmet';
          }
        }

        if(reqMin){
          toggleRequirement(reqMin, val.length >= 8, 'min');
        }

        if(reqMatch){
          toggleRequirement(reqMatch, val && val === val2 && val.length >= 8, 'match');
        }

        // Announce current status for screen readers
        const announcer = document.getElementById('prAnnouncer');
        if(announcer){
          const msgs = [];
          msgs.push(results.min ? 'Minimum length satisfied' : 'Minimum length not satisfied');
          msgs.push(results.match ? 'Passwords match' : 'Passwords do not match');
          announcer.textContent = msgs.join('. ');
        }

        // Overall success
        const pr = document.querySelector('.password-requirements');
        const icon = pr ? pr.querySelector('.pr-icon') : null;
        const allOk = results.min && results.match;
        if(pr){ pr.classList.toggle('all-met', allOk); }
        if(icon){
          if(allOk){ icon.classList.add('happy'); setTimeout(()=>icon.classList.remove('happy'), 600); }
          else { icon.classList.remove('happy'); }
        }
      }

      if(pw && pwc){
        pw.addEventListener('input', updateReqs);
        pwc.addEventListener('input', updateReqs);
        updateReqs();
      }
    })();
  </script>
</body>

</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/reset-password.blade.php ENDPATH**/ ?>