<?php
// Script to test sending PurchaseRequestSubmitted mail to the requester of the latest PR
require __DIR__ . "/../vendor/autoload.php";
$app = require_once __DIR__ . "/../bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

$pr = App\Models\PurchaseRequest::orderBy('id', 'desc')->first();
if (!$pr) {
    echo "No PurchaseRequest records found.\n";
    exit(1);
}

echo "Attempting send to requester: {$pr->email}\n";
try {
    Mail::to($pr->email)->send(new App\Mail\PurchaseRequestSubmitted($pr));
    echo "Send call completed without exception. Check logs for details.\n";
} catch (Throwable $e) {
    echo "Send failed: " . $e->getMessage() . "\n";
}
