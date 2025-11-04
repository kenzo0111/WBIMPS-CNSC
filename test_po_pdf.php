<?php
/**
 * Quick test script to generate a Purchase Order PDF from database
 * 
 * Usage:
 * - To view PDF in browser: http://localhost:8000/purchase-order/view/1
 * - To download PDF: http://localhost:8000/purchase-order/1/pdf
 * 
 * Replace '1' with the actual purchase order ID
 */

echo "Purchase Order PDF Generation Test\n";
echo "===================================\n\n";

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get the first purchase order
$po = \App\Models\PurchaseOrder::first();

if (!$po) {
    echo "No purchase orders found in the database.\n";
    exit(1);
}

echo "Found Purchase Order:\n";
echo "  ID: {$po->id}\n";
echo "  PO Number: {$po->po_number}\n";
echo "  Supplier: {$po->supplier}\n";
echo "  Grand Total: {$po->grand_total}\n";
echo "  Items: " . count($po->items ?? []) . "\n\n";

echo "Available URLs:\n";
echo "  View/Preview: http://localhost:8000/purchase-order/view/{$po->id}\n";
echo "  Download PDF: http://localhost:8000/purchase-order/{$po->id}/pdf\n\n";

echo "Test completed successfully!\n";
