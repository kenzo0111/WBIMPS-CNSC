<?php

use App\Models\Item;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create an authenticated admin user for tests
    $this->user = User::factory()->admin()->create([
        'status' => 'active',
    ]);
    $this->actingAs($this->user, 'web');

    // Create some items and suppliers for stock operations
    \App\Models\Item::factory()->count(5)->create();
    \App\Models\Supplier::factory()->count(3)->create();
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
    $item = Item::factory()->create([
        'sku' => 'SKU-12345',
        'quantity' => 100,
    ]);

    $stockInData = [
        'transaction_id' => 'SI-2025-001',
        'sku' => 'SKU-12345',
        'product_name' => 'Test Item',
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
    $item = Item::factory()->create([
        'sku' => 'SKU-UPDATE-001',
    ]);

    $stockIn = StockIn::factory()->create([
        'sku' => 'SKU-UPDATE-001',
        'quantity' => 50,
    ]);

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
    $item = Item::factory()->create([
        'sku' => 'SKU-12345',
        'quantity' => 100,
    ]);

    $stockOutData = [
        'transaction_id' => 'SO-2025-001',
        'issue_id' => 'ISS-2025-001',
        'sku' => 'SKU-12345',
        'product_name' => 'Test Item',
        'quantity' => 10,
        'unit_cost' => 100.00,
        'department' => 'IT Department',
        'issued_to' => 'Jane Doe',
        'issued_to_designation' => 'Staff',
        'issued_by' => $this->user->name,
        'issued_by_designation' => 'Storekeeper',
        'approved_by' => 'John Approver',
        'approved_by_designation' => 'Head of Office',
        'purpose' => 'Office use',
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

    // Download the generated RIS PDF for this stock out (smoke-check that it returns 200)
    $createdId = $response->json('data.id');
    $pdfResponse = $this->get("/stock-out/{$createdId}/pdf");
    $pdfResponse->assertStatus(200);

    // Render the RIS view directly and assert it contains the approver name (ensures data is passed to the template)
    $stockOut = \App\Models\StockOut::find($createdId);
    $risData = (object) [
        'ris_no' => $stockOut->issue_id,
        'entity_name' => 'Camarines Norte State College',
        'fund_cluster' => $stockOut->fund_cluster ?? '',
        'division' => $stockOut->department ?? '',
        'responsibility_center_code' => $stockOut->responsibility_center_code ?? '',
        'purpose' => $stockOut->purpose ?? '',
        'stock_available' => true,
        'items' => [],
        'requested_by_name' => $stockOut->issued_to ?? '',
        'requested_by_designation' => $stockOut->issued_to_designation ?? '',
        'requested_by_date' => $stockOut->date_issued ? \Carbon\Carbon::parse($stockOut->date_issued) : null,
        'approved_by_name' => $stockOut->approved_by ?? '',
        'approved_by_designation' => $stockOut->approved_by_designation ?? '',
        'approved_by_date' => $stockOut->approved_by_date ? \Carbon\Carbon::parse($stockOut->approved_by_date) : null,
        'issued_by_name' => $stockOut->issued_by ?? '',
        'issued_by_designation' => $stockOut->issued_by_designation ?? '',
        'issued_by_date' => $stockOut->date_issued ? \Carbon\Carbon::parse($stockOut->date_issued) : null,
        'received_by_date' => $stockOut->date_issued ? \Carbon\Carbon::parse($stockOut->date_issued) : null,
    ];

    $html = view('pdf.requisition_issue_slips_pdf', ['ris' => $risData])->render();
    $this->assertStringContainsString('John Approver', $html);

    $this->assertDatabaseHas('stock_out', [
        'transaction_id' => 'SO-2025-001',
        'sku' => 'SKU-12345',
        'issued_to' => 'Jane Doe',
        'issued_to_designation' => 'Staff',
        'issued_by' => $this->user->name,
        'issued_by_designation' => 'Storekeeper',
        'approved_by' => 'John Approver',
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
    $item = Item::factory()->create([
        'sku' => 'SKU-UPDATE-002',
        'quantity' => 100,
    ]);

    $stockOut = StockOut::factory()->create([
        'sku' => 'SKU-UPDATE-002',
        'quantity' => 10,
    ]);

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
        ->assertJsonValidationErrors(['sku', 'product_name', 'quantity', 'date_issued']);
});

test('calculates total cost for stock out transaction', function () {
    $item = Item::factory()->create([
        'sku' => 'SKU-99999',
        // ensure enough starting quantity so remaining after removing 5 stays above threshold
        'quantity' => 100,
    ]);

    $stockOutData = [
        'transaction_id' => 'SO-2025-002',
        'issue_id' => 'ISS-2025-002',
        'sku' => 'SKU-99999',
        'product_name' => 'Calculated Item',
        'quantity' => 5,
        'unit_cost' => 100.50,
        'date_issued' => now()->format('Y-m-d'),
    ];

    $response = $this->postJson('/api/stock-out', $stockOutData);

    $response->assertStatus(201);

    $totalCost = $response->json('data.total_cost');
    expect((float) $totalCost)->toBe(502.5);
});
