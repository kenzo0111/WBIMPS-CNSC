<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$status = $kernel->bootstrap();

use App\Models\Activity;
$items = Activity::orderBy('created_at','desc')->limit(5)->get();
echo json_encode($items->toArray(), JSON_PRETTY_PRINT);
