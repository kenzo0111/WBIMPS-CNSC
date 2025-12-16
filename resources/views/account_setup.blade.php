<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
    <link rel="icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>Set Up Your Account</title>
    @vite('resources/css/AccessSystem.css')
        <style>
            /* Small adjustments for the account setup card */
            .setup-sub {
                color: rgba(255,255,255,0.92);
                margin: 6px 0 16px;
                font-size: 15px;
                line-height: 1.45;
                letter-spacing: 0.2px;
                max-width: 520px;
                word-wrap: break-word;
            }
            .setup-sub strong {
                display: inline-block;
                font-weight: 700;
                color: #fff;
                background: rgba(255,255,255,0.03);
                padding: 3px 8px;
                border-radius: 6px;
                margin-left: 6px;
            }

            @media (max-width: 480px) {
                .setup-sub { font-size: 14px; max-width: 100%; }
                .setup-sub strong { display: block; margin-top: 6px; margin-left: 0; }
            }

            .note { font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 12px; }

            /* Primary button (kept in-view to ensure consistent appearance) */
            .primary-btn {
                background: #dc2626;
                color: #fff;
                border: none;
                padding: 12px 28px;
                border-radius: 999px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                letter-spacing: .5px;
                box-shadow: 0 8px 25px rgba(220, 38, 38, 0.35);
                transition: all .25s ease;
                display: inline-block;
            }
            .primary-btn:hover { background: #b91c1c; transform: translateY(-2px); }
            .primary-btn:active { transform: translateY(0); }

            /* Ensure success / error messages are visible */
            .success-card { color: #bbf7d0; background: rgba(16,185,129,0.06); padding:8px 12px; border-radius:8px; margin-bottom:12px; }
            .form-error { color: #fecaca; margin-top:6px; }

            /* Alert dialog styles */
            .alert-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.45);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            .alert-overlay.open { display: flex; }
            .alert-dialog {
                background: #0f172a;
                color: #fff;
                padding: 20px;
                border-radius: 12px;
                min-width: 320px;
                max-width: 90%;
                box-shadow: 0 10px 30px rgba(2,6,23,0.6);
            }
            .alert-dialog.success { border-left: 6px solid #10b981; }
            .alert-dialog.error { border-left: 6px solid #ef4444; }
            .alert-dialog h3 { margin:0 0 8px 0; font-size:18px; }
            .alert-dialog p { margin:0 0 12px 0; color: rgba(255,255,255,0.9); }
            .alert-actions { display:flex; justify-content:flex-end; }
            .alert-actions button { background:transparent; border:1px solid rgba(255,255,255,0.08); color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; }
            .alert-actions button.primary { background:#dc2626; border:none; margin-left:8px; }

        </style>
</head>
<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <img src="{{ $imagesPath ? ($imagesPath . '/cnscrefine.png') : asset('images/cnscrefine.png') }}" alt="CNSC Logo" />
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
                <div class="login-badge"><span>One CNSC, One Goal</span></div>

                <form class="login-card" method="POST" action="{{ route('account.setup.post') }}">
                    @csrf
                    <input type="hidden" name="token" value="{{ $token }}">

                    <div class="login-header">
                        <h2 id="welcomeHeading">Set Up Your Account</h2>
                        <div class="login-subtitle" id="welcomeSub">Create a password to activate your account</div>
                    </div>

                    <p class="setup-sub">Welcome, <strong>{{ $user->name }}</strong>. Choose a secure password (minimum 8 characters).</p>

                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <input class="form-input" id="password" name="password" type="password" required minlength="8" autocomplete="new-password" />
                        @error('password')
                            <div class="form-error">{{ $message }}</div>
                        @enderror
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="password_confirmation">Confirm Password</label>
                        <input class="form-input" id="password_confirmation" name="password_confirmation" type="password" required minlength="8" autocomplete="new-password" />
                        @error('password_confirmation')
                            <div class="form-error">{{ $message }}</div>
                        @enderror
                    </div>

                    @if(session('success'))
                        <div class="success-card">{{ session('success') }}</div>
                    @endif

                    @error('token')
                        <div class="form-error">{{ $message }}</div>
                    @enderror

                    <button class="primary-btn" type="submit">Set Password & Activate Account</button>

                    <div class="note">If you didn't request this, ignore this page or contact the administrator.</div>
                </form>
            </div>
        </div>
    </main>

    <!-- Alert dialog -->
    <div id="alertOverlay" class="alert-overlay" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="alertDialog" class="alert-dialog" role="alert">
            <h3 id="alertDialogTitle">Alert</h3>
            <p id="alertDialogMessage"></p>
            <div class="alert-actions">
                <button id="alertDialogClose">Close</button>
                <button id="alertDialogOk" class="primary">OK</button>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function(){
            const success = @json(session('success'));
            const errors = @json($errors->all());
            const overlay = document.getElementById('alertOverlay');
            const dialog = document.getElementById('alertDialog');
            const dialogTitle = document.getElementById('alertDialogTitle');
            const dialogMessage = document.getElementById('alertDialogMessage');
            const closeBtn = document.getElementById('alertDialogClose');
            const okBtn = document.getElementById('alertDialogOk');

            function showAlert(type, msg){
                dialog.classList.remove('success','error');
                dialog.classList.add(type === 'success' ? 'success' : 'error');
                dialogTitle.textContent = type === 'success' ? 'Success' : 'Error';
                dialogMessage.textContent = msg;
                overlay.setAttribute('aria-hidden', 'false');
                overlay.classList.add('open');
            }

            function closeAlert(){
                overlay.setAttribute('aria-hidden', 'true');
                overlay.classList.remove('open');
            }

            closeBtn.addEventListener('click', closeAlert);
            okBtn.addEventListener('click', closeAlert);
            overlay.addEventListener('click', function(e){ if(e.target === overlay) closeAlert(); });

            // Show server messages if present
            if(success){
                showAlert('success', success);
            } else if(errors && errors.length){
                showAlert('error', errors[0]);
            }

            // Client-side password match validation
            const form = document.querySelector('form.login-card');
            form.addEventListener('submit', function(e){
                const pw = document.getElementById('password').value;
                const pwc = document.getElementById('password_confirmation').value;
                if(pw !== pwc){
                    e.preventDefault();
                    showAlert('error', 'Passwords do not match.');
                    document.getElementById('password_confirmation').focus();
                }
            });
        });
    </script>

</body>
</html>