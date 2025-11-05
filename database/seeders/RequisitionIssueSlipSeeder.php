<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RequisitionIssueSlip;
use Carbon\Carbon;

class RequisitionIssueSlipSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $risRecords = [
            [
                'ris_no' => 'RIS-2025-001',
                'entity_name' => 'Camarines Norte State College',
                'fund_cluster' => 'FC-2025',
                'division' => 'Supply Management',
                'responsibility_center_code' => 'RCC-001',
                'office' => 'Main Office',
                'purpose' => 'Office supplies for administrative department',
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
                    [
                        'stock_no' => 'STK-003',
                        'unit' => 'Piece',
                        'description' => 'Stapler',
                        'quantity' => '3',
                        'stock_available' => 'No',
                        'issue_quantity' => '0',
                        'remarks' => 'Out of stock'
                    ],
                ],
                'requested_by_name' => 'Juan Dela Cruz',
                'requested_by_designation' => 'Administrative Officer',
                'requested_by_date' => Carbon::now()->subDays(2),
                'approved_by_name' => 'Maria Santos',
                'approved_by_designation' => 'Department Head',
                'approved_by_date' => Carbon::now()->subDays(1),
                'issued_by_name' => 'Pedro Garcia',
                'issued_by_designation' => 'Supply Officer',
                'issued_by_date' => Carbon::now(),
                'received_by_name' => 'Juan Dela Cruz',
                'received_by_designation' => 'Administrative Officer',
                'received_by_date' => Carbon::now(),
                'status' => 'completed',
            ],
            [
                'ris_no' => 'RIS-2025-002',
                'entity_name' => 'Camarines Norte State College',
                'fund_cluster' => 'FC-2025',
                'division' => 'IT Department',
                'responsibility_center_code' => 'RCC-002',
                'office' => 'IT Office',
                'purpose' => 'Computer peripherals and accessories',
                'items' => [
                    [
                        'stock_no' => 'STK-100',
                        'unit' => 'Piece',
                        'description' => 'USB Flash Drive 32GB',
                        'quantity' => '15',
                        'stock_available' => 'Yes',
                        'issue_quantity' => '15',
                        'remarks' => 'For faculty use'
                    ],
                    [
                        'stock_no' => 'STK-101',
                        'unit' => 'Piece',
                        'description' => 'HDMI Cable 2m',
                        'quantity' => '8',
                        'stock_available' => 'Yes',
                        'issue_quantity' => '8',
                        'remarks' => ''
                    ],
                ],
                'requested_by_name' => 'Ana Reyes',
                'requested_by_designation' => 'IT Coordinator',
                'requested_by_date' => Carbon::now()->subDays(1),
                'approved_by_name' => 'Robert Gomez',
                'approved_by_designation' => 'IT Manager',
                'approved_by_date' => Carbon::now(),
                'issued_by_name' => 'Pedro Garcia',
                'issued_by_designation' => 'Supply Officer',
                'issued_by_date' => null,
                'received_by_name' => null,
                'received_by_designation' => null,
                'received_by_date' => null,
                'status' => 'pending',
            ],
            [
                'ris_no' => 'RIS-2025-003',
                'entity_name' => 'Camarines Norte State College',
                'fund_cluster' => 'FC-2025',
                'division' => 'Engineering Department',
                'responsibility_center_code' => 'RCC-003',
                'office' => 'Engineering Office',
                'purpose' => 'Laboratory equipment and supplies',
                'items' => [
                    [
                        'stock_no' => 'STK-200',
                        'unit' => 'Set',
                        'description' => 'Soldering Iron Kit',
                        'quantity' => '5',
                        'stock_available' => 'Yes',
                        'issue_quantity' => '5',
                        'remarks' => 'For electronics lab'
                    ],
                    [
                        'stock_no' => 'STK-201',
                        'unit' => 'Box',
                        'description' => 'Resistor Set (Assorted)',
                        'quantity' => '10',
                        'stock_available' => 'Yes',
                        'issue_quantity' => '10',
                        'remarks' => ''
                    ],
                ],
                'requested_by_name' => 'Carlos Martinez',
                'requested_by_designation' => 'Laboratory Supervisor',
                'requested_by_date' => Carbon::now(),
                'approved_by_name' => 'Linda Cruz',
                'approved_by_designation' => 'Dean',
                'approved_by_date' => Carbon::now(),
                'issued_by_name' => 'Pedro Garcia',
                'issued_by_designation' => 'Supply Officer',
                'issued_by_date' => Carbon::now(),
                'received_by_name' => 'Carlos Martinez',
                'received_by_designation' => 'Laboratory Supervisor',
                'received_by_date' => Carbon::now(),
                'status' => 'completed',
            ],
        ];

        foreach ($risRecords as $record) {
            RequisitionIssueSlip::create($record);
        }

        $this->command->info('RequisitionIssueSlip records seeded successfully!');
    }
}
