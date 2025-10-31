<!doctype html>
<html lang="{{ app()->getLocale() }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ $modelName ?? 'Record' }} Status Updated</title>
  <style>
    .preheader { display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#333333;">
  <span class="preheader">{{ $modelName ?? 'Record' }} {{ $modelId ?? '' }} status changed to {{ $newStatus ?? '' }}.</span>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f6f6; padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e5e5e5;">
          <tr>
            <td style="background:{{ $brandPrimary ?? '#800000' }};padding:18px 20px;color:{{ $brandText ?? '#ffffff' }};">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;width:64px;">
                    @php
                      $logoSrc = $logoCid ?? ($logoUrl ?? asset('images/UCN1.png'));
                    @endphp
                    <img src="{{ $logoSrc }}" alt="Supply System" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;" onerror="this.style.display='none'">
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <div style="font-size:18px;font-weight:600;line-height:1;color:{{ $brandText ?? '#ffffff' }};">Web-Based Inventory and Procurement Management System</div>
                    <div style="font-size:12px;opacity:0.95;color:{{ $brandText ?? '#ffffff' }};">Status Change Notification</div>
                  </td>
                  <td style="text-align:right;vertical-align:middle;font-size:12px;color:{{ $brandText ?? '#ffffff' }};">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 24px;">
              <h1 style="margin:0 0 8px 0;font-size:20px;color:#222;">{{ $modelName ?? 'Record' }} status updated</h1>
              <p style="margin:0 0 14px 0;color:#666;font-size:14px;">A status change has been recorded for the item below. If you need more information, please contact the Supply System administrator.</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;width:180px;font-weight:600;color:#444;">Entity</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $modelName ?? '-' }}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">ID</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $modelId ?? '-' }}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Previous Status</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $oldStatus ?? '-' }}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">New Status</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;"><strong>{{ $newStatus ?? '-' }}</strong></td>
                </tr>
                @if(!empty($notes))
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Notes</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $notes }}</td>
                </tr>
                @endif
              </table>

              <p style="margin-top:18px;color:#666;font-size:13px;">Reference: <strong style="color:#333;">{{ $modelId ?? '' }}</strong></p>
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
</html>