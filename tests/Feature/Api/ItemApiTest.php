<?php

use App\Models\Category;
use App\Models\Item;
use App\Models\User;

beforeEach(function () {
    // Create an authenticated user for tests
    $user = User::factory()->admin()->create([
        'status' => 'active',
    ]);
    $this->actingAs($user, 'web');
});

test('can list items', function () {
    Item::factory()->count(3)->create();

    $response = $this->getJson('/api/items');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'quantity', 'unit_cost'],
            ],
        ]);
});

test('can create an item', function () {
    $category = Category::factory()->create();

    $itemData = [
        'sku' => 'SKU-TEST-001',
        'name' => 'Test Item',
        'description' => 'Test Description',
        'quantity' => 100,
        'unit' => 'pcs',
        'unit_cost' => 50.00,
        'category_id' => $category->id,
    ];

    $response = $this->postJson('/api/items', $itemData);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'name' => 'Test Item',
                'quantity' => 100,
            ],
        ]);

    $this->assertDatabaseHas('items', [
        'name' => 'Test Item',
        'quantity' => 100,
    ]);
});

test('can show a specific item', function () {
    $item = Item::factory()->create();

    $response = $this->getJson("/api/items/{$item->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $item->id,
                'name' => $item->name,
            ],
        ]);
});

test('can update an item', function () {
    $item = Item::factory()->create(['name' => 'Old Name']);

    $response = $this->putJson("/api/items/{$item->id}", [
        'sku' => $item->sku,
        'name' => 'Updated Name',
        'description' => $item->description,
        'quantity' => $item->quantity,
        'unit' => $item->unit,
        'unit_cost' => $item->unit_cost,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('items', [
        'id' => $item->id,
        'name' => 'Updated Name',
    ]);
});

test('can delete an item', function () {
    $item = Item::factory()->create();

    $response = $this->deleteJson("/api/items/{$item->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('items', [
        'id' => $item->id,
    ]);
});

test('can get low stock items', function () {
    Item::factory()->create(['quantity' => 5]);
    Item::factory()->create(['quantity' => 100]);

    $response = $this->getJson('/api/items/low-stock');

    $response->assertStatus(200);
});

test('validates required fields when creating item', function () {
    $response = $this->postJson('/api/items', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['sku', 'name']);
});
