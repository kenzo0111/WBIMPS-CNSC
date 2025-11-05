<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create an authenticated user for tests
    $this->user = User::factory()->create([
        'is_admin' => true,
        'status' => 'active',
    ]);
    $this->actingAs($this->user, 'web');
});

test('can list products', function () {
    Product::factory()->count(3)->create();

    $response = $this->getJson('/api/products');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'quantity', 'unit_cost'],
            ],
        ]);
});

test('can create a product', function () {
    $category = Category::factory()->create();

    $productData = [
        'name' => 'Test Product',
        'description' => 'Test Description',
        'quantity' => 100,
        'unit' => 'pcs',
        'unit_cost' => 50.00,
        'category_id' => $category->id,
    ];

    $response = $this->postJson('/api/products', $productData);

    $response->assertStatus(201)
        ->assertJson([
            'name' => 'Test Product',
            'quantity' => 100,
        ]);

    $this->assertDatabaseHas('products', [
        'name' => 'Test Product',
        'quantity' => 100,
    ]);
});

test('can show a specific product', function () {
    $product = Product::factory()->create();

    $response = $this->getJson("/api/products/{$product->id}");

    $response->assertStatus(200)
        ->assertJson([
            'id' => $product->id,
            'name' => $product->name,
        ]);
});

test('can update a product', function () {
    $product = Product::factory()->create(['name' => 'Old Name']);

    $response = $this->putJson("/api/products/{$product->id}", [
        'name' => 'Updated Name',
        'description' => $product->description,
        'quantity' => $product->quantity,
        'unit' => $product->unit,
        'unit_cost' => $product->unit_cost,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Updated Name',
    ]);
});

test('can delete a product', function () {
    $product = Product::factory()->create();

    $response = $this->deleteJson("/api/products/{$product->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('products', [
        'id' => $product->id,
    ]);
});

test('can get low stock products', function () {
    Product::factory()->create(['quantity' => 5]);
    Product::factory()->create(['quantity' => 100]);

    $response = $this->getJson('/api/products/low-stock');

    $response->assertStatus(200);
});

test('validates required fields when creating product', function () {
    $response = $this->postJson('/api/products', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'quantity', 'unit', 'unit_cost']);
});
