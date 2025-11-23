<?php
// Small helper to check whether inspection_acceptance_reports exists
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $has = \Schema::hasTable('inspection_acceptance_reports');
    echo "Schema::hasTable('inspection_acceptance_reports') => " . ($has ? 'true' : 'false') . PHP_EOL;

    $all = DB::select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()");
    $migs = DB::table('migrations')->where('migration', 'like', '%inspection_acceptance_reports%')->get();
    echo "\nRelevant migrations entries:\n" . json_encode($migs, JSON_PRETTY_PRINT) . PHP_EOL;
    echo "All tables in current DB:\n" . json_encode($all, JSON_PRETTY_PRINT) . PHP_EOL;
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
