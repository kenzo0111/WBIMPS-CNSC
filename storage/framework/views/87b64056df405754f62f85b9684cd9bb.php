<!doctype html>
<html lang="<?php echo e(app()->getLocale()); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Account Created - Login OTP</title>
    <style>
        .preheader { display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#333333;">
    <span class="preheader">Your account has been created. Use the OTP to log in for the first time.</span>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f6f6; padding:20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e5e5e5;">
                    <tr>
                        <td style="background:#800000;padding:18px 20px;color:#ffffff;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="vertical-align:middle;width:64px;">
                                        <img src="<?php echo e(asset('images/UCN1.png')); ?>" alt="Supply System" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;" onerror="this.style.display='none'">
                                    </td>
                                    <td style="vertical-align:middle;padding-left:12px;">
                                        <div style="font-size:18px;font-weight:600;line-height:1;color:#ffffff;">Web-Based Inventory and Procurement Management System</div>
                                        <div style="font-size:12px;opacity:0.95;color:#ffffff;">Account Creation Notification</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:22px 24px;">
                            <h1 style="margin:0 0 8px 0;font-size:20px;color:#222;">Welcome to the Supply System</h1>
                            <p style="margin:0 0 14px 0;color:#666;font-size:14px;">Your account has been successfully created. To log in for the first time, please use the One-Time Password (OTP) provided below.</p>

                            <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
                                <h2 style="margin:0 0 10px 0;font-size:24px;color:#495057;">Your Login OTP</h2>
                                <div style="font-size:32px;font-weight:700;color:#dc3545;letter-spacing:4px;background:#fff;padding:15px;border:2px solid #dee2e6;border-radius:6px;display:inline-block;"><?php echo e($otp); ?></div>
                                <p style="margin:15px 0 0 0;color:#6c757d;font-size:13px;">This OTP is valid for 30 minutes. Do not share it with anyone.</p>
                            </div>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-collapse:collapse;">
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;width:120px;font-weight:600;color:#444;">Name</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($user->name); ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Email</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($user->email); ?></td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Role</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><?php echo e($user->role); ?></td>
                                </tr>
                            </table>

                            <div style="background:#fff3cd;border:1px solid #ffeaa7;border-radius:6px;padding:15px;margin-top:20px;">
                                <h3 style="margin:0 0 8px 0;font-size:16px;color:#856404;">Important Instructions:</h3>
                                <ul style="margin:0;padding-left:20px;color:#856404;font-size:14px;">
                                    <li>Use the OTP above as your password when logging in for the first time.</li>
                                    <li>You will be prompted to change your password after successful login.</li>
                                    <li>If the OTP expires, contact your administrator for a new one.</li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 24px;background:#fafafa;border-top:1px solid #f0f0f0;">
                            <div style="font-size:13px;color:#333;margin-bottom:8px;">Regards,<br/><strong>Supply and Property Management Office</strong></div>
                            <div style="font-size:12px;color:#666;margin-bottom:8px;">This message was sent by the Supply System. If you believe you received this in error, please contact the administrator.</div>
                            <div style="font-size:11px;color:#999;line-height:1.3;">Confidentiality Notice: This e-mail and any attachments are intended solely for the use of the intended recipient(s) and may contain confidential information. If you are not the intended recipient, please notify the sender and delete this message.</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/emails/user_created_otp.blade.php ENDPATH**/ ?>