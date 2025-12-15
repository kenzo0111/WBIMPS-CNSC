<?php
// Script to call PurchaseRequestController::batchStore directly to test email_sent in response
require __DIR__ . "/../vendor/autoload.php";
$app = require_once __DIR__ . "/../bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;

$payload = [
    'email' => env('MAIL_USERNAME') ?: env('MAIL_FROM_ADDRESS'),
    'requester' => 'Scripted Test',
    'designation' => 'Tester',
    'department' => 'IT',
    'items' => [
        ['item_description' => 'Script Item A', 'quantity' => 1, 'unit_cost' => 10],
        ['item_description' => 'Script Item B', 'quantity' => 2, 'unit_cost' => 20],
    ],
];

$request = Request::create('/api/purchase-requests/batch', 'POST', [], [], [], [], json_encode($payload));
$request->headers->set('Content-Type', 'application/json');

$controller = new App\Http\Controllers\Api\PurchaseRequestController();
$response = $controller->batchStore($request);

if ($response instanceof Illuminate\Http\JsonResponse) {
    echo json_encode($response->getData(), JSON_PRETTY_PRINT) . PHP_EOL;
} else {
    echo "Response class: " . get_class($response) . PHP_EOL;
    echo (string) $response . PHP_EOL;
}
