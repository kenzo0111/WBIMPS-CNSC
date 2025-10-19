<!doctype html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Purchase Request Submitted</title>
    <style>
        /* Keep minimal styles for clients that support them; critical styles are inlined for compatibility */
        .preheader { display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
    </style>
    
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#333333;">
    <!-- Preheader text: appears in inbox preview -->
    <span class="preheader">Purchase request {{ $pr->request_id }} has been submitted by {{ $pr->requester }}.</span>

    <!-- Outer wrapper table for better email client support -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f6f6; padding:20px 0;">
        <tr>
            <td align="center">
                <!-- Centered card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #e5e5e5;">
                    <tr>
                        <td style="background:{{ $brandPrimary ?? '#800000' }};padding:18px 20px;color:{{ $brandText ?? '#ffffff' }};">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="vertical-align:middle;width:64px;">
                                        <!-- Logo: prefer embedded CID (inline) then a provided URL, otherwise asset() -->
                                        @php
                                            // Prefer embedding inside the view (using $message->embed)
                                            // because embedding via the Mailable may not always produce
                                            // the CID when rendering outside of the mailer. If $message
                                            // is available (it is when Laravel actually sends the mail),
                                            // use it to embed the local file. Otherwise prefer a CID
                                            // passed from the Mailable, and finally fall back to the
                                            // public URL.
                                            $logoLocal = public_path('images/UCN1.png');
                                            $logoSrc = null;
                                            try {
                                                if (isset($message) && method_exists($message, 'embed') && file_exists($logoLocal)) {
                                                    $logoSrc = $message->embed($logoLocal);
                                                }
                                            } catch (\Throwable $e) {
                                                // ignore and fall back
                                                $logoSrc = null;
                                            }

                                            if (empty($logoSrc)) {
                                                $logoSrc = $logoCid ?? ($logoUrl ?? asset('images/UCN1.png'));
                                            }
                                        @endphp
                                        <img src="{{ $logoSrc }}" alt="Supply System" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;" onerror="this.style.display='none'">
                                    </td>
                                    <td style="vertical-align:middle;padding-left:12px;">
                                        <div style="font-size:18px;font-weight:600;line-height:1;color:{{ $brandText ?? '#ffffff' }};">Web-Based Inventory and Procurement Management System</div>
                                        <div style="font-size:12px;opacity:0.95;color:{{ $brandText ?? '#ffffff' }};">Purchase Request Notification</div>
                                    </td>
                                    <td style="text-align:right;vertical-align:middle;font-size:12px;color:{{ $brandText ?? '#ffffff' }};">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:22px 24px;">
                            <h1 style="margin:0 0 8px 0;font-size:20px;color:#222;">Purchase Request Submitted</h1>
                            <p style="margin:0 0 14px 0;color:#666;font-size:14px;">This email confirms that we have received your purchase request. It is now being processed. You will be notified when it is approved or if more information is needed..</p>

                            <!-- Summary rows -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;">
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;width:180px;font-weight:600;color:#444;">Request ID</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $pr->request_id }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Requester</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $pr->requester }} &lt;{{ $pr->email }}&gt;</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Department</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $pr->department }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Priority</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $pr->priority }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Needed Date</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">
                                        @php
                                            try {
                                                $needed = isset($pr->needed_date) && $pr->needed_date
                                                    ? \Carbon\Carbon::parse($pr->needed_date)->locale(app()->getLocale())->isoFormat('LL')
                                                    : '-';
                                            } catch (\Throwable $e) {
                                                $needed = $pr->needed_date ?? '-';
                                            }
                                        @endphp
                                        {{ $needed }}
                                    </td>
                                </tr>
                                @if(!empty($pr->remarks))
                                <tr>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#444;">Remarks</td>
                                    <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#333;">{{ $pr->remarks }}</td>
                                </tr>
                                @endif
                            </table>

                            <!-- Items table -->
                            <h3 style="margin:18px 0 8px 0;font-size:16px;color:#222;">Requested Items</h3>
                            <table role="table" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e9e9e9;font-size:14px;">
                                <thead>
                                    <tr>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;width:6%;background:#fafafa;">#</th>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;background:#fafafa;">Description</th>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;width:12%;background:#fafafa;">Qty</th>
                                        <th style="padding:8px 10px;border-bottom:1px solid #e9e9e9;text-align:left;width:18%;background:#fafafa;">Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @php $idx = 0; @endphp
                                    @foreach((array) $pr->items as $item)
                                        @php $idx++; @endphp
                                        <tr>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">{{ $idx }}</td>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">
                                                @if(is_array($item))
                                                    {{ $item['description'] ?? json_encode($item) }}
                                                @else
                                                    {{ $item }}
                                                @endif
                                            </td>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">{{ is_array($item) ? ($item['quantity'] ?? '-') : '-' }}</td>
                                            <td style="padding:8px 10px;border-bottom:1px solid #f5f5f5;vertical-align:top;">{{ is_array($item) ? ($item['unit'] ?? '-') : '-' }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                            <p style="margin-top:18px;color:#666;font-size:13px;">Reference: <strong style="color:#333;">{{ $pr->request_id }}</strong></p>
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