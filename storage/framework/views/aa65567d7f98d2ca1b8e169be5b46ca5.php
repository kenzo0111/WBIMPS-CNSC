<!doctype html>
<html lang="<?php echo e(app()->getLocale()); ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Request</title>
  <style>
    .preheader { display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
    a.button { display:inline-block;padding:10px 18px;background:<?php echo e($brandPrimary ?? '#dc2626'); ?>;color:<?php echo e($brandText ?? '#ffffff'); ?>;text-decoration:none;border-radius:4px;font-weight:600 }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#333333;">
  <span class="preheader">Password reset request for <?php echo e($user->name); ?>.</span>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f6f6; padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e5e5e5;">
          <tr>
            <td style="background:<?php echo e($brandPrimary ?? '#800000'); ?>;padding:18px 20px;color:<?php echo e($brandText ?? '#ffffff'); ?>;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;width:64px;">
                    <?php
                      $logoLocal = public_path('images/UCN1.png');
                      $logoSrc = null;
                      try {
                        if (isset($message) && method_exists($message, 'embed') && file_exists($logoLocal)) {
                          $logoSrc = $message->embed($logoLocal);
                        }
                      } catch (\Throwable $e) {
                        $logoSrc = null;
                      }

                      if (empty($logoSrc)) {
                        $logoSrc = $logoCid ?? ($logoUrl ?? asset('images/UCN1.png'));
                      }
                    ?>
                    <img src="<?php echo e($logoSrc); ?>" alt="Supply System" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;" onerror="this.style.display='none'">
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <div style="font-size:18px;font-weight:600;line-height:1;color:<?php echo e($brandText ?? '#ffffff'); ?>;">Web-Based Inventory and Procurement Management System</div>
                    <div style="font-size:12px;opacity:0.95;color:<?php echo e($brandText ?? '#ffffff'); ?>;">Password Reset Request</div>
                  </td>
                  <td style="text-align:right;vertical-align:middle;font-size:12px;color:<?php echo e($brandText ?? '#ffffff'); ?>;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 24px;">
              <h1 style="margin:0 0 8px 0;font-size:20px;color:#222;">Password Reset Request</h1>
              <p style="margin:0 0 14px 0;color:#666;font-size:14px;">Hello Administrator,</p>
              <p style="margin:0 0 14px 0;color:#666;font-size:14px;"><?php echo e($user->name); ?> (<?php echo e($user->email); ?>) has requested a password reset. Please review and assist with resetting their password.</p>

              <p style="margin:14px 0;">
                <a href="<?php echo e($resetUrl); ?>" class="button" style="display:inline-block;padding:10px 18px;background:<?php echo e($brandPrimary ?? '#dc2626'); ?>;color:<?php echo e($brandText ?? '#ffffff'); ?>;text-decoration:none;border-radius:4px;font-weight:600;">Reset Password</a>
              </p>

              <p style="margin-top:18px;color:#666;font-size:13px;">If you did not expect this request, you can safely ignore it.</p>
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
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/emails/password_reset_request.blade.php ENDPATH**/ ?>