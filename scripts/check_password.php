<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'admin@example.com')->first();
if (!$user) {
    echo "User not found\n";
    exit(1);
}

$password = 'admin123';
if (Hash::check($password, $user->password)) {
    echo "Password matches\n";
} else {
    echo "Password does not match\n";
}