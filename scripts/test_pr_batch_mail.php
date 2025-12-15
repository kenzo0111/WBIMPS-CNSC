<?php
// Script to test sending PurchaseRequestSubmitted mail for batch items
require __DIR__ . "/../vendor/autoload.php";
$app = require_once __DIR__ . "/../bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

$records = App\Models\PurchaseRequest::orderBy('id', 'desc')->take(3)->get()->all();
if (count($records) < 1) {
    echo "No existing PurchaseRequest records found — creating a sample one.\n";
    $pr = App\Models\PurchaseRequest::create([
        'request_id' => date('Y-m') . '-0999-01',
        'email' => env('MAIL_USERNAME') ?: env('MAIL_FROM_ADDRESS'),
        'requester' => 'Test User',
        'designation' => 'Tester',
        'department' => 'IT',
        'item_description' => 'Test item',
        'quantity' => 1,
        'unit_cost' => 100,
        'total_cost' => 100,
        'status' => 'Incoming',
        'submitted_at' => now(),
    ]);
    $records = [$pr];
}

$first = $records[0];
$to = $first->email ?: (env('MAIL_USERNAME') ?: env('MAIL_FROM_ADDRESS'));

echo "Sending batch mail to requester: {$to}\n";
try {
    Mail::to($to)->send(new App\Mail\PurchaseRequestSubmitted($first, collect($records)));
    echo "Batch send completed without exception. Check logs for details.\n";
} catch (Throwable $e) {
    echo "Batch send failed: " . $e->getMessage() . "\n";
}
