<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>Set Up Your Account</title>
    @vite('resources/css/AccessSystem.css')
        <style>
            /* Small adjustments for the account setup card */
            .setup-sub { color: rgba(255,255,255,0.85); margin-bottom: 12px; }
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

</body>
</html>