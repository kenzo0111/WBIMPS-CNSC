<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\RequisitionIssueSlip;

$ris = RequisitionIssueSlip::create([
    'ris_no' => 'RIS-2025-11-001',
    'purchase_order_id' => 17,
    'entity_name' => 'Camarines Norte State College',
    'fund_cluster' => 'FC-2025',
    'division' => 'Admin Department',
    'responsibility_center_code' => 'RCC-001',
    'office' => 'Main Office',
    'purpose' => 'Office Supplies for Administrative Department',
    'items' => [
        [
            'stock_no' => 'STK-001',
            'unit' => 'Ream',
            'description' => 'Bond Paper A4',
            'quantity' => '10',
            'stock_available' => 'Yes',
            'issue_quantity' => '10',
            'remarks' => 'Urgent'
        ],
        [
            'stock_no' => 'STK-002',
            'unit' => 'Box',
            'description' => 'Ballpen (Blue)',
            'quantity' => '5',
            'stock_available' => 'Yes',
            'issue_quantity' => '5',
            'remarks' => ''
        ],
    ],
    'requested_by_name' => 'Juan Dela Cruz',
    'requested_by_designation' => 'Administrative Officer',
    'requested_by_date' => now()->subDays(2),
    'approved_by_name' => 'Maria Santos',
    'approved_by_designation' => 'Department Head',
    'approved_by_date' => now()->subDays(1),
    'issued_by_name' => 'Pedro Garcia',
    'issued_by_designation' => 'Supply Officer',
    'issued_by_date' => now(),
    'received_by_name' => 'Juan Dela Cruz',
    'received_by_designation' => 'Administrative Officer',
    'received_by_date' => now(),
    'status' => 'completed',
]);

echo "✅ RIS Created Successfully!\n";
echo "RIS ID: {$ris->id}\n";
echo "RIS Number: {$ris->ris_no}\n";
echo "Linked to Purchase Order ID: {$ris->purchase_order_id}\n";
