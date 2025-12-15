<?php

use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    // Create an authenticated admin user for tests
    $user = User::factory()->admin()->create([
        'status' => 'active',
    ]);
    $this->actingAs($user, 'web');
    // API endpoints are served under web middleware but exempted from CSRF
    // in the application; ensure tests don't fail due to CSRF token checks.
    // Provide a CSRF header like the browser does so POSTs succeed in tests.
    // Ensure a token exists in the session and use it for the header.
    $csrf = 'test-csrf-token';
    $this->withSession(['_token' => $csrf]);
    $this->withHeader('X-CSRF-TOKEN', $csrf);

    // Fake mail to prevent actual email sending
    Mail::fake();
});

test('can list purchase requests', function () {
    PurchaseRequest::factory()->count(3)->create();

    $response = $this->getJson('/api/purchase-requests');

    $response->assertStatus(200)
        ->assertJsonCount(3);
});

test('can filter purchase requests by department', function () {
    PurchaseRequest::factory()->create(['department' => 'IT']);
    PurchaseRequest::factory()->create(['department' => 'HR']);
    PurchaseRequest::factory()->create(['department' => 'IT']);

    $response = $this->getJson('/api/purchase-requests?department=IT');

    $response->assertStatus(200)
        ->assertJsonCount(2);
});

test('can filter purchase requests by status', function () {
    PurchaseRequest::factory()->pending()->create();
    PurchaseRequest::factory()->approved()->create();
    PurchaseRequest::factory()->pending()->create();

    $response = $this->getJson('/api/purchase-requests?status=pending');

    $response->assertStatus(200)
        ->assertJsonCount(2);
});

test('can create a purchase request', function () {
    $requestData = [
        'email' => 'test@example.com',
        'requester' => 'John Doe',
        'department' => 'IT',
        'items' => ['Laptop', 'Mouse', 'Keyboard'],
        'unit' => 'pcs',
        'quantity' => 3,
        'unitCost' => 50000,
        'neededDate' => now()->addDays(7)->format('Y-m-d'),
        'priority' => 'High',
        'purpose' => 'Equipment for lab experiments',
    ];

    $response = $this->postJson('/api/purchase-requests', $requestData);

    $response->assertStatus(201)
        ->assertJson([
            'email' => 'test@example.com',
            'requester' => 'John Doe',
            'department' => 'IT',
            'purpose' => 'Equipment for lab experiments',
            'total_cost' => 150000.0,
            'status' => 'Incoming',
        ]);

    $this->assertDatabaseHas('purchase_requests', [
        'email' => 'test@example.com',
        'requester' => 'John Doe',
        'department' => 'IT',
        'purpose' => 'Equipment for lab experiments',
        'total_cost' => 150000.0,
    ]);
});

test('generates unique request IDs with current year', function () {
    $currentPeriod = now()->format('Y-m');

    $response = $this->postJson('/api/purchase-requests', [
        'email' => 'test@example.com',
        'requester' => 'John Doe',
        'department' => 'IT',
        'items' => ['Test Item'],
        'purpose' => 'Test purpose',
    ]);

    $response->assertStatus(201);
    $requestId = $response->json('request_id');
    expect($requestId)->toStartWith("{$currentPeriod}-");
});

test('validates required fields when creating purchase request', function () {
    $response = $this->postJson('/api/purchase-requests', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'requester', 'department', 'items', 'purpose']);
});

test('does not allow backdated neededDate', function () {
    $yesterday = now()->subDay()->format('Y-m-d');

    $response = $this->postJson('/api/purchase-requests', [
        'email' => 'past@example.com',
        'requester' => 'Jane Past',
        'department' => 'Admin',
        'items' => ['Paper'],
        'neededDate' => $yesterday,
        'purpose' => 'Testing past date',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['neededDate']);
});

test('stores total_cost when client sends totalCost explicitly', function () {
    $requestData = [
        'email' => 'bill@example.com',
        'requester' => 'Bill Gates',
        'department' => 'IT',
        'items' => ['Monitor'],
        'unit' => 'pcs',
        'quantity' => 2,
        // no unitCost provided, client passes totalCost directly
        'totalCost' => 300.00,
        'purpose' => 'Replacement monitors',
    ];

    $response = $this->postJson('/api/purchase-requests', $requestData);
    $response->assertStatus(201);

    $this->assertDatabaseHas('purchase_requests', [
        'email' => 'bill@example.com',
        'requester' => 'Bill Gates',
        'department' => 'IT',
        'total_cost' => 300.00,
    ]);
});

test('can update purchase request status by request_id', function () {
    $pr = PurchaseRequest::factory()->create([
        'request_id' => now()->format('Y-m') . '-0001',
        'status' => 'Incoming',
    ]);

    $response = $this->postJson("/api/status-requests/{$pr->request_id}/status", [
        'status' => 'Approved',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'status' => 'Approved',
        ]);

    $this->assertDatabaseHas('purchase_requests', [
        'request_id' => $pr->request_id,
        'status' => 'Approved',
    ]);
});

test('can update purchase request status by numeric id', function () {
    $pr = PurchaseRequest::factory()->create(['status' => 'Incoming']);

    $response = $this->postJson("/api/status-requests/{$pr->id}/status", [
        'status' => 'Rejected',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'status' => 'Rejected',
        ]);
});

test('returns 404 when updating non-existent purchase request', function () {
    $response = $this->postJson('/api/status-requests/99999/status', [
        'status' => 'Approved',
    ]);

    $response->assertStatus(404)
        ->assertJson([
            'error' => 'Purchase request not found',
        ]);
});

test('calculates total cost for each purchase request', function () {
    PurchaseRequest::factory()->create([
        'unit_cost' => 100.50,
        'quantity' => 5,
    ]);

    $response = $this->getJson('/api/purchase-requests');

    $response->assertStatus(200);

    $totalCost = $response->json('0.total_cost');
    expect($totalCost)->toBe(502.5);
});

test('can create purchase requests in a batch', function () {
    $items = [
        ['item_description' => 'Notebook', 'quantity' => 2, 'unit' => 'pcs', 'unit_cost' => 50],
        ['item_description' => 'Pens', 'quantity' => 10, 'unit' => 'pcs', 'unit_cost' => 5],
    ];

    $response = $this->postJson('/api/purchase-requests/batch', [
        'email' => 'batch@example.com',
        'requester' => 'Batch User',
        'department' => 'Admin',
        'items' => $items,
        'purpose' => 'Batch create test',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['request_id', 'batch_items', 'email_sent']);

    $json = $response->json();
    expect(is_array($json['batch_items']))->toBeTrue();
    expect(count($json['batch_items']))->toBe(2);

    // Ensure multiple rows were created for this batch, one per item
    $this->assertDatabaseHas('purchase_requests', ['email' => 'batch@example.com', 'requester' => 'Batch User', 'item_description' => 'Notebook']);
    $this->assertDatabaseHas('purchase_requests', ['email' => 'batch@example.com', 'requester' => 'Batch User', 'item_description' => 'Pens']);
    $this->assertEquals(2, \App\Models\PurchaseRequest::where('email', 'batch@example.com')->count());
});
