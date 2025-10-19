# Mailer / Status email notes

I added a Mailable and observer that sends email when a `PurchaseRequest.status` changes.

Files added:

- `app/Mail/StatusChangedMail.php` - the Mailable
- `resources/views/emails/status_changed.blade.php` - email view
- `app/Observers/PurchaseRequestObserver.php` - observer that sends mail on status change
- `app/Providers/AppServiceProvider.php` - observer registration

Configure mail in your `.env` (example using SMTP):

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_FROM_NAME="SupplySystem"

Quick test (Tinker):

1. Start tinker:

```powershell
php artisan tinker
```

2. Send a test mail (replace recipient address as needed):

```php
// run inside tinker
use App\Mail\StatusChangedMail;
use Illuminate\Support\Facades\Mail;

Mail::to('you@example.com')->send(new StatusChangedMail('Purchase Request', 'REQ-123', 'pending', 'approved', 'Test note'));
```

Or update a real `PurchaseRequest` record's `status` field via tinker or the app UI to trigger the observer.

Notes:

- The observer sends the email to the requester's `email` field (if present) and to all users with `is_admin = true`.
- If you prefer queued mail, convert the Mailable to implement `ShouldQueue` and configure queue workers.
