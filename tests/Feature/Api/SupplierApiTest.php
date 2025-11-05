<?php

use App\Models\Supplier;
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

test('can list suppliers', function () {
    Supplier::factory()->count(3)->create();

    $response = $this->getJson('/api/suppliers');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'contact', 'email'],
            ],
        ]);
});

test('can create a supplier', function () {
    $supplierData = [
        'name' => 'ABC Corporation',
        'address' => '123 Business St, Metro Manila',
        'tin' => '123-456-789-000',
        'contact' => '+63 912 345 6789',
        'email' => 'contact@abccorp.com',
    ];

    $response = $this->postJson('/api/suppliers', $supplierData);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'name' => 'ABC Corporation',
                'email' => 'contact@abccorp.com',
            ],
        ]);

    $this->assertDatabaseHas('suppliers', [
        'name' => 'ABC Corporation',
        'email' => 'contact@abccorp.com',
    ]);
});

test('can show a specific supplier', function () {
    $supplier = Supplier::factory()->create();

    $response = $this->getJson("/api/suppliers/{$supplier->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
            ],
        ]);
});

test('can update a supplier', function () {
    $supplier = Supplier::factory()->create(['name' => 'Old Name']);

    $response = $this->putJson("/api/suppliers/{$supplier->id}", [
        'name' => 'Updated Supplier Name',
        'address' => $supplier->address,
        'contact' => $supplier->contact,
        'email' => $supplier->email,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('suppliers', [
        'id' => $supplier->id,
        'name' => 'Updated Supplier Name',
    ]);
});

test('can delete a supplier', function () {
    $supplier = Supplier::factory()->create();

    $response = $this->deleteJson("/api/suppliers/{$supplier->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('suppliers', [
        'id' => $supplier->id,
    ]);
});

test('validates required fields when creating supplier', function () {
    $response = $this->postJson('/api/suppliers', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('validates email format when creating supplier', function () {
    $response = $this->postJson('/api/suppliers', [
        'name' => 'Test Supplier',
        'email' => 'invalid-email',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('can search suppliers by name', function () {
    Supplier::factory()->create(['name' => 'ABC Corporation']);
    Supplier::factory()->create(['name' => 'XYZ Enterprises']);
    Supplier::factory()->create(['name' => 'ABC Trading']);

    $response = $this->getJson('/api/suppliers?search=ABC');

    $response->assertStatus(200);
    
    $data = $response->json('data');
    expect(count($data))->toBeGreaterThanOrEqual(2);
});
