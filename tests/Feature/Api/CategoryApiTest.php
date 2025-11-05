<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'is_admin' => true,
        'status' => 'active',
    ]);
    $this->actingAs($this->user, 'web');
});

test('can list categories', function () {
    Category::factory()->count(3)->create();

    $response = $this->getJson('/api/categories');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'code', 'name'],
            ],
        ]);
});

test('can create a category', function () {
    $categoryData = [
        'code' => 'CAT001',
        'name' => 'Test Category',
        'description' => 'Test Description',
    ];

    $response = $this->postJson('/api/categories', $categoryData);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'name' => 'Test Category',
            ],
        ]);

    $this->assertDatabaseHas('categories', [
        'code' => 'CAT001',
        'name' => 'Test Category',
    ]);
});

test('can show a specific category', function () {
    $category = Category::factory()->create();

    $response = $this->getJson("/api/categories/{$category->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $category->id,
                'name' => $category->name,
            ],
        ]);
});

test('can update a category', function () {
    $category = Category::factory()->create(['name' => 'Old Name']);

    $response = $this->putJson("/api/categories/{$category->id}", [
        'code' => $category->code,
        'name' => 'Updated Name',
        'description' => $category->description,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
        'name' => 'Updated Name',
    ]);
});

test('can delete a category', function () {
    $category = Category::factory()->create();

    $response = $this->deleteJson("/api/categories/{$category->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('categories', [
        'id' => $category->id,
    ]);
});

test('validates required fields when creating category', function () {
    $response = $this->postJson('/api/categories', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});
