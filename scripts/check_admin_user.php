<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::where('email', 'admin@example.com')->first();
if (! $user) {
    echo "NOT_FOUND\n";
    exit(0);
}

echo "FOUND\n";
echo json_encode($user->toArray(), JSON_PRETTY_PRINT);
