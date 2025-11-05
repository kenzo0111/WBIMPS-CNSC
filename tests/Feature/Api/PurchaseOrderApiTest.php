<?php

use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create an authenticated admin user for tests
    $this->user = User::factory()->create([
        'is_admin' => true,
        'status' => 'active',
    ]);
    $this->actingAs($this->user, 'web');
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
            'status' => 'approved',
        ]);

    $this->assertDatabaseHas('purchase_orders', [
        'id' => $po->id,
        'status' => 'approved',
    ]);
});

test('validates required fields when creating purchase order', function () {
    $response = $this->postJson('/api/purchase-orders', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['po_number', 'supplier']);
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
