<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing PAR Setup ===\n\n";

// Check counts
$parCount = \App\Models\PropertyAcknowledgementReceipt::count();
$iarCount = \App\Models\InspectionAcceptanceReport::count();
$poCount = \App\Models\PurchaseOrder::count();

echo "PAR Count: $parCount\n";
echo "IAR Count: $iarCount\n";
echo "PO Count: $poCount\n\n";

// Check first PO
$po = \App\Models\PurchaseOrder::first();
if ($po) {
    echo "First PO:\n";
    echo "  ID: {$po->id}\n";
    echo "  PO Number: {$po->po_number}\n";
    echo "  Items: " . count($po->items ?? []) . "\n";
    echo "  Has PAR: " . ($po->propertyAcknowledgementReceipt ? 'Yes (PAR ID: ' . $po->propertyAcknowledgementReceipt->id . ')' : 'No') . "\n";
    echo "  Has IAR: " . ($po->inspectionAcceptanceReport ? 'Yes (IAR ID: ' . $po->inspectionAcceptanceReport->id . ')' : 'No') . "\n";
} else {
    echo "No purchase orders found.\n";
}

echo "\n=== Test Complete ===\n";
