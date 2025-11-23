<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\RequisitionIssueSlip;

beforeEach(function () {
    // Create an authenticated admin user for tests
    $user = User::factory()->create([
        'is_admin' => true,
        'status' => 'active',
    ]);
    $this->actingAs($user, 'web');
});

test('can list purchase orders', function () {
    PurchaseOrder::factory()->count(3)->create();

    $response = $this->getJson('/api/purchase-orders');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'po_number', 'supplier'],
            ],
        ]);
});

test('can create a purchase order', function () {
    $poData = [
        'po_number' => 'PO-2025-001',
        'supplier' => 'ABC Supplier Inc.',
        'supplier_address' => '123 Main St, City',
        'date_of_purchase' => now()->format('Y-m-d'),
        'tin_number' => '123-456-789',
        'mode_of_procurement' => 'Public Bidding',
        'place_of_delivery' => 'Main Office',
        'delivery_term' => '30 days',
        'date_of_delivery' => now()->addDays(30)->format('Y-m-d'),
        'payment_term' => 'Net 30',
        'items' => [
            ['name' => 'Item 1', 'quantity' => 10, 'unit_cost' => 100],
            ['name' => 'Item 2', 'quantity' => 5, 'unit_cost' => 200],
        ],
        'grand_total' => 2000.00,
        'status' => 'pending',
    ];

    $response = $this->postJson('/api/purchase-orders', $poData);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'po_number' => 'PO-2025-001',
                'supplier' => 'ABC Supplier Inc.',
            ],
        ]);

    $this->assertDatabaseHas('purchase_orders', [
        'po_number' => 'PO-2025-001',
        'supplier' => 'ABC Supplier Inc.',
    ]);
});

test('creating a purchase order with items marked generateIAR creates an IAR record (even without iar_no)', function () {
    $poData = [
        'po_number' => 'PO-2025-002',
        'supplier' => 'IAR Supplier Inc.',
        'items' => [
            ['name' => 'Item A', 'quantity' => 2, 'unit_cost' => 500, 'generateIAR' => true],
        ],
        'grand_total' => 1000.00,
    ];

    $response = $this->postJson('/api/purchase-orders', $poData);

    $response->assertStatus(201);

    $poId = $response->json('data.id');

    // Assert an IAR was created and linked to the purchase order
    $this->assertDatabaseHas('inspection_acceptance_reports', [
        'purchase_order_id' => $poId,
        'status' => 'Active',
    ]);
});

test('creating a purchase order with provided iar_form_data saves fields on the IAR record', function () {
    $poData = [
        'po_number' => 'PO-2025-003',
        'supplier' => 'IAR Supplier Inc.',
        'items' => [
            ['name' => 'Item B', 'quantity' => 1, 'unit_cost' => 750, 'generateIAR' => true],
        ],
        'iar_form_data' => [
            'iar_no' => 'IAR-2025-999',
            'inspection_status' => 'complete',
            'acceptance_status' => 'accepted',
            'inspection_officer_label' => 'ENGR. LEONEL JOHN M. PADRIGON',
            'inspection_officer_position' => 'INSPECTION OFFICER / INSPECTION COMMITTEE',
            'custodian_position' => 'Supply Custodian',
        ],
        'grand_total' => 750.00,
    ];

    $response = $this->postJson('/api/purchase-orders', $poData);

    $response->assertStatus(201);

    $poId = $response->json('data.id');

    // Assert the IAR with the provided number was created
    $this->assertDatabaseHas('inspection_acceptance_reports', [
        'purchase_order_id' => $poId,
        'iar_no' => 'IAR-2025-999',
        'inspection_status' => 'complete',
        'acceptance_status' => 'accepted',
    ]);

    // Assert inspection label was saved
    $this->assertDatabaseHas('inspection_acceptance_reports', [
        'purchase_order_id' => $poId,
        'inspection_officer_label' => 'ENGR. LEONEL JOHN M. PADRIGON',
    ]);

    // Assert positions were saved
    $this->assertDatabaseHas('inspection_acceptance_reports', [
        'purchase_order_id' => $poId,
        'inspection_officer_position' => 'INSPECTION OFFICER / INSPECTION COMMITTEE',
        'custodian_position' => 'Supply Custodian',
    ]);
});

test('creating a purchase order with ris_form_data links RIS record to the purchase order', function () {
    $poData = [
        'po_number' => 'PO-2025-010',
        'supplier' => 'RIS Supplier Inc.',
        'items' => [
            ['name' => 'RIS Item', 'quantity' => 1, 'unit_cost' => 100, 'generateRIS' => true],
        ],
        'ris_form_data' => [
            'ris_no' => 'RIS-2025-001',
            'entity_name' => 'Camarines Norte State College',
        ],
        'grand_total' => 100.00,
    ];

    $response = $this->postJson('/api/purchase-orders', $poData);

    $response->assertStatus(201);

    $poId = $response->json('data.id');

    // Ensure RIS was created and linked to the purchase order
    $this->assertDatabaseHas('requisition_issue_slips', [
        'purchase_order_id' => $poId,
        'ris_no' => 'RIS-2025-001',
    ]);
});

test('can show a specific purchase order', function () {
    $po = PurchaseOrder::factory()->create();

    $response = $this->getJson("/api/purchase-orders/{$po->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $po->id,
                'po_number' => $po->po_number,
            ],
        ]);
});

test('can update a purchase order', function () {
    $po = PurchaseOrder::factory()->create(['supplier' => 'Old Supplier']);

    $response = $this->putJson("/api/purchase-orders/{$po->id}", [
        'po_number' => $po->po_number,
        'supplier' => 'Updated Supplier',
        'items' => $po->items ?? [],
        'grand_total' => $po->grand_total ?? 0,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('purchase_orders', [
        'id' => $po->id,
        'supplier' => 'Updated Supplier',
    ]);
});

test('can delete a purchase order', function () {
    $po = PurchaseOrder::factory()->create();

    $response = $this->deleteJson("/api/purchase-orders/{$po->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('purchase_orders', [
        'id' => $po->id,
    ]);
});

test('can update purchase order status', function () {
    $po = PurchaseOrder::factory()->create(['status' => 'pending']);

    $response = $this->postJson("/api/purchase-orders/{$po->id}/status", [
        'status' => 'approved',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'status' => 'approved',
            ],
        ]);

    $this->assertDatabaseHas('purchase_orders', [
        'id' => $po->id,
        'status' => 'approved',
    ]);
});

test('validates required fields when creating purchase order', function () {
    $response = $this->postJson('/api/purchase-orders', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['po_number']);
});

test('purchase order has correct date casting', function () {
    $po = PurchaseOrder::factory()->create([
        'date_of_purchase' => '2025-11-05',
    ]);

    $response = $this->getJson("/api/purchase-orders/{$po->id}");

    $response->assertStatus(200);

    expect($response->json('data.date_of_purchase'))->toContain('2025-11-05');
});

test('purchase order stores items as json array', function () {
    $items = [
        ['name' => 'Item 1', 'quantity' => 10, 'unit_cost' => 100],
        ['name' => 'Item 2', 'quantity' => 5, 'unit_cost' => 200],
    ];

    $po = PurchaseOrder::factory()->create(['items' => $items]);

    $response = $this->getJson("/api/purchase-orders/{$po->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'items' => $items,
            ],
        ]);
});
