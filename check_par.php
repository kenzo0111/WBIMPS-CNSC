<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking PAR Records...\n\n";

$par = \App\Models\PropertyAcknowledgementReceipt::latest()->first();

if ($par) {
    echo "Latest PAR Record:\n";
    echo "================\n";
    echo "ID: " . $par->id . "\n";
    echo "PAR No: " . $par->par_no . "\n";
    echo "Entity Name: " . ($par->entity_name ?? 'NULL') . "\n";
    echo "Fund Cluster: " . ($par->fund_cluster ?? 'NULL') . "\n";
    echo "Date: " . ($par->date ?? 'NULL') . "\n";
    echo "Received By Name: " . ($par->received_by_name ?? 'NULL') . "\n";
    echo "Received By Position: " . ($par->received_by_position ?? 'NULL') . "\n";
    echo "Received Date: " . ($par->received_date ?? 'NULL') . "\n";
    echo "Issued By Name: " . ($par->issued_by_name ?? 'NULL') . "\n";
    echo "Issued By Position: " . ($par->issued_by_position ?? 'NULL') . "\n";
    echo "Issued Date: " . ($par->issued_date ?? 'NULL') . "\n";
    echo "Status: " . ($par->status ?? 'NULL') . "\n";
    echo "\nItems:\n";
    print_r($par->items);
    
    echo "\n\n=== All PAR Records ===\n";
    $allPars = \App\Models\PropertyAcknowledgementReceipt::all();
    foreach ($allPars as $p) {
        echo "\nPAR #{$p->id} - {$p->par_no}:\n";
        echo "  Entity: " . ($p->entity_name ?? 'NULL') . "\n";
        echo "  Fund Cluster: " . ($p->fund_cluster ?? 'NULL') . "\n";
        echo "  Received By: " . ($p->received_by_name ?? 'NULL') . "\n";
        echo "  Issued By: " . ($p->issued_by_name ?? 'NULL') . "\n";
    }
} else {
    echo "No PAR records found in database.\n";
}
