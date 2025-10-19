<?php
// One-off script to send a test mail using the app bootstrap
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\StatusChangedMail;

$to = $argv[1] ?? 'balcevince@gmail.com';
$insecure = isset($argv[2]) && $argv[2] === '--insecure';

if ($insecure) {
    // WARNING: bypassing certificate verification for testing only
    config(['mail.mailers.smtp.stream' => [
        'ssl' => [
            'allow_self_signed' => true,
            'verify_peer' => false,
            'verify_peer_name' => false,
        ],
    ]]);
}
try {
    Mail::to($to)->send(new StatusChangedMail('Purchase Request', 'REQ-TEST', 'pending', 'approved', 'Test from script'));
    echo "OK: mail attempted to {$to}\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
