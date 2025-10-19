<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pr = App\Models\PurchaseRequest::first();
if (!$pr) {
    echo "No purchase request found\n";
    exit(1);
}

$m = new App\Mail\PurchaseRequestSubmitted($pr);
echo $m->render();
