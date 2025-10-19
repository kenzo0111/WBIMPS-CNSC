<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Create a temporary PR
$pr = App\Models\PurchaseRequest::create([
    'request_id' => 'REQ-'.date('Y').'-999',
    'email' => 'test@example.com',
    'requester' => 'Test User',
    'department' => 'IT',
    'items' => ['Test item'],
    'unit' => 'PCS',
    'needed_date' => date('Y-m-d'),
    'priority' => 'Low',
    'status' => 'Incoming',
    'submitted_at' => now(),
    'metadata' => ['ip' => '127.0.0.1', 'user_agent' => 'cli-test'],
]);

$m = new App\Mail\PurchaseRequestSubmitted($pr);
echo $m->render();

// cleanup
$pr->delete();
