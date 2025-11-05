<?php

use App\Models\Product;
use App\Models\StockIn;
use App\Models\StockOut;
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

// Stock In Tests

test('can list stock in transactions', function () {
    StockIn::factory()->count(3)->create();

    $response = $this->getJson('/api/stock-in');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'transaction_id', 'sku', 'product_name', 'quantity'],
            ],
        ]);
});

test('can create a stock in transaction', function () {
    $product = Product::factory()->create([
        'sku' => 'SKU-12345',
        'quantity' => 100,
    ]);

    $stockInData = [
        'transaction_id' => 'SI-2025-001',
        'sku' => 'SKU-12345',
        'product_name' => 'Test Product',
        'quantity' => 50,
        'unit_cost' => 100.00,
        'supplier' => 'ABC Supplier',
        'date_received' => now()->format('Y-m-d'),
        'received_by' => 'John Doe',
    ];

    $response = $this->postJson('/api/stock-in', $stockInData);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'transaction_id' => 'SI-2025-001',
                'sku' => 'SKU-12345',
            ],
        ]);

    $this->assertDatabaseHas('stock_in', [
        'transaction_id' => 'SI-2025-001',
        'sku' => 'SKU-12345',
    ]);
});

test('can show a specific stock in transaction', function () {
    $stockIn = StockIn::factory()->create();

    $response = $this->getJson("/api/stock-in/{$stockIn->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $stockIn->id,
                'transaction_id' => $stockIn->transaction_id,
            ],
        ]);
});

test('can update a stock in transaction', function () {
    $stockIn = StockIn::factory()->create(['quantity' => 50]);

    $response = $this->putJson("/api/stock-in/{$stockIn->id}", [
        'transaction_id' => $stockIn->transaction_id,
        'sku' => $stockIn->sku,
        'product_name' => $stockIn->product_name,
        'quantity' => 100,
        'unit_cost' => $stockIn->unit_cost,
        'date_received' => $stockIn->date_received,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('stock_in', [
        'id' => $stockIn->id,
        'quantity' => 100,
    ]);
});

test('can delete a stock in transaction', function () {
    $stockIn = StockIn::factory()->create();

    $response = $this->deleteJson("/api/stock-in/{$stockIn->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('stock_in', [
        'id' => $stockIn->id,
    ]);
});

test('validates required fields when creating stock in', function () {
    $response = $this->postJson('/api/stock-in', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['transaction_id', 'sku', 'product_name', 'quantity']);
});

// Stock Out Tests

test('can list stock out transactions', function () {
    StockOut::factory()->count(3)->create();

    $response = $this->getJson('/api/stock-out');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'transaction_id', 'issue_id', 'sku', 'product_name', 'quantity'],
            ],
        ]);
});

test('can create a stock out transaction', function () {
    $product = Product::factory()->create([
        'sku' => 'SKU-12345',
        'quantity' => 100,
    ]);

    $stockOutData = [
        'transaction_id' => 'SO-2025-001',
        'issue_id' => 'ISS-2025-001',
        'sku' => 'SKU-12345',
        'product_name' => 'Test Product',
        'quantity' => 10,
        'unit_cost' => 100.00,
        'department' => 'IT Department',
        'issued_to' => 'Jane Doe',
        'issued_by' => $this->user->name,
        'purpose' => 'Office use',
        'status' => 'approved',
        'date_issued' => now()->format('Y-m-d'),
    ];

    $response = $this->postJson('/api/stock-out', $stockOutData);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'transaction_id' => 'SO-2025-001',
                'sku' => 'SKU-12345',
            ],
        ]);

    $this->assertDatabaseHas('stock_out', [
        'transaction_id' => 'SO-2025-001',
        'sku' => 'SKU-12345',
    ]);
});

test('can show a specific stock out transaction', function () {
    $stockOut = StockOut::factory()->create();

    $response = $this->getJson("/api/stock-out/{$stockOut->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $stockOut->id,
                'transaction_id' => $stockOut->transaction_id,
            ],
        ]);
});

test('can update a stock out transaction', function () {
    $stockOut = StockOut::factory()->create(['quantity' => 10]);

    $response = $this->putJson("/api/stock-out/{$stockOut->id}", [
        'transaction_id' => $stockOut->transaction_id,
        'issue_id' => $stockOut->issue_id,
        'sku' => $stockOut->sku,
        'product_name' => $stockOut->product_name,
        'quantity' => 20,
        'date_issued' => $stockOut->date_issued,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('stock_out', [
        'id' => $stockOut->id,
        'quantity' => 20,
    ]);
});

test('can delete a stock out transaction', function () {
    $stockOut = StockOut::factory()->create();

    $response = $this->deleteJson("/api/stock-out/{$stockOut->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('stock_out', [
        'id' => $stockOut->id,
    ]);
});

test('validates required fields when creating stock out', function () {
    $response = $this->postJson('/api/stock-out', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['transaction_id', 'issue_id', 'sku', 'product_name', 'quantity']);
});

test('calculates total cost for stock out transaction', function () {
    $stockOutData = [
        'transaction_id' => 'SO-2025-002',
        'issue_id' => 'ISS-2025-002',
        'sku' => 'SKU-99999',
        'product_name' => 'Calculated Product',
        'quantity' => 5,
        'unit_cost' => 100.50,
        'date_issued' => now()->format('Y-m-d'),
    ];

    $response = $this->postJson('/api/stock-out', $stockOutData);

    $response->assertStatus(201);
    
    $totalCost = $response->json('data.total_cost');
    expect((float) $totalCost)->toBe(502.5);
});
