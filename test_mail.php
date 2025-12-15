<?php

// Lightweight script to test sending the PurchaseRequestSubmitted mail
// Run: php test_mail.php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

// Resolve PR model and mail class
$pr = null;
try {
    $pr = App\Models\PurchaseRequest::first();
} catch (Throwable $e) {
    echo "Error resolving PurchaseRequest model: " . $e->getMessage() . PHP_EOL;
    exit(1);
}

if (!$pr) {
    echo "No PurchaseRequest records found in database. Create one before testing.\n";
    exit(1);
}

$to = env('MAIL_USERNAME') ?: env('MAIL_FROM_ADDRESS') ?: 'test@example.com';

echo "Sending test PurchaseRequestSubmitted email to: {$to}\n";

try {
    Mail::to($to)->send(new App\Mail\PurchaseRequestSubmitted($pr));
    echo "Mail sent (no exceptions thrown). Check your inbox or mail logs.\n";
} catch (Throwable $e) {
    echo "Mail send failed: " . $e->getMessage() . PHP_EOL;
    if (method_exists($e, 'getTraceAsString')) {
        echo $e->getTraceAsString() . PHP_EOL;
    }
    exit(1);
}

exit(0);
