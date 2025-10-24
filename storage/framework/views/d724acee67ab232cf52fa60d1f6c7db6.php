<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>" />
    <title>Forgot Password</title>
    <?php echo app('Illuminate\Foundation\Vite')('resources/css/AccessSystem.css'); ?>
    <style>
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

        .form-error { color: #fecaca; margin-top:6px; }
        .back-link { color: #60a5fa; text-decoration: none; font-size: 14px; }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <img src="<?php echo e($imagesPath ? ($imagesPath . '/cnscrefine.png') : asset('images/cnscrefine.png')); ?>" alt="CNSC Logo" />
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

                <form class="login-card" method="POST" action="<?php echo e(route('password.email')); ?>">
                    <?php echo csrf_field(); ?>
                    <div class="login-header">
                        <h2>Forgot Your Password?</h2>
                        <div class="login-subtitle">Enter your email address and we'll help you reset your password</div>
                    </div>

                    <?php if(session('success')): ?>
                        <div style="background: #d1fae5; color: #065f46; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #a7f3d0;">
                            <?php echo e(session('success')); ?>

                        </div>
                    <?php endif; ?>

                    <div class="form-group">
                        <label class="form-label" for="email">Email Address</label>
                        <input class="form-input" id="email" name="email" type="email" placeholder="cnsc.spmo@edu.ph" required value="<?php echo e(old('email')); ?>" />
                        <?php $__errorArgs = ['email'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?>
                            <div class="form-error"><?php echo e($message); ?></div>
                        <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?>
                    </div>

                    <button class="primary-btn" type="submit">Send Reset Link</button>

                    <div style="text-align: center; margin-top: 16px;">
                        <a href="<?php echo e(route('login')); ?>" class="back-link">← Back to Login</a>
                    </div>
                </form>
            </div>
        </div>
    </main>
</body>
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/forgot-password.blade.php ENDPATH**/ ?>