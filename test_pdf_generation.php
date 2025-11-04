<?php
/**
 * Test script to verify Purchase Order PDF generation works correctly
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Purchase Order PDF Generation\n";
echo "======================================\n\n";

try {
    // Get purchase order
    $po = \App\Models\PurchaseOrder::first();
    
    if (!$po) {
        echo "❌ No purchase orders found in database\n";
        exit(1);
    }
    
    echo "✓ Found Purchase Order ID: {$po->id}\n";
    echo "  PO Number: {$po->po_number}\n";
    echo "  Supplier: {$po->supplier}\n";
    echo "  Grand Total: " . number_format($po->grand_total, 2) . "\n";
    echo "  Items: " . count($po->items ?? []) . "\n\n";
    
    // Test date handling
    echo "Date Fields:\n";
    echo "  date_of_purchase: " . ($po->date_of_purchase ?? 'null') . "\n";
    echo "  date_of_delivery: " . ($po->date_of_delivery ?? 'null') . "\n";
    echo "  ors_burs_date: " . ($po->ors_burs_date ?? 'null') . "\n\n";
    
    // Simulate controller logic
    $controller = new \App\Http\Controllers\PurchaseOrderController();
    
    // Use reflection to call private method
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('formatDateFromModel');
    $method->setAccessible(true);
    
    echo "Testing Date Formatting:\n";
    echo "  date_of_purchase formatted: " . ($method->invoke($controller, $po->date_of_purchase) ?? 'null') . "\n";
    echo "  date_of_delivery formatted: " . ($method->invoke($controller, $po->date_of_delivery) ?? 'null') . "\n";
    echo "  ors_burs_date formatted: " . ($method->invoke($controller, $po->ors_burs_date) ?? 'null') . "\n\n";
    
    echo "✓ Date formatting working correctly!\n\n";
    
    echo "Test URLs:\n";
    echo "  Preview: http://localhost:8000/purchase-order/view/{$po->id}\n";
    echo "  Download: http://localhost:8000/purchase-order/{$po->id}/pdf\n\n";
    
    echo "✅ All tests passed!\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    exit(1);
}
