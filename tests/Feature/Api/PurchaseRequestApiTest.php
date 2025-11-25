<?php

use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    // Create an authenticated admin user for tests
    $user = User::factory()->create([
        'is_admin' => true,
        'status' => 'active',
    ]);
    $this->actingAs($user, 'web');

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
    $currentYear = now()->year;

    $response = $this->postJson('/api/purchase-requests', [
        'email' => 'test@example.com',
        'requester' => 'John Doe',
        'department' => 'IT',
        'items' => ['Test Item'],
        'purpose' => 'Test purpose',
    ]);

    $response->assertStatus(201);

    $requestId = $response->json('request_id');
    expect($requestId)->toStartWith("REQ-{$currentYear}-");
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
        'request_id' => 'REQ-2025-001',
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
        'request_id' => 'REQ-2025-001',
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
