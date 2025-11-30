<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Item;
use App\Models\User;

uses(RefreshDatabase::class);

test('creating stock-in logs activity and appears in activities api', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Create an item record that stock-in will reference
    $item = Item::factory()->create(['sku' => 'E0001', 'name' => 'Ballpoint Pen', 'quantity' => 10]);

    // Post a new stock-in record
    $payload = [
        'transaction_id' => 'TXN-001',
        'sku' => $item->sku,
        'product_name' => $item->name,
        'quantity' => 5,
        'unit_cost' => 25,
        'date_received' => now()->toDateString(),
    ];

    $response = $this->postJson('/api/stock-in', $payload);
    $response->assertStatus(201);

    // Check that the stock-in was created
    $this->assertDatabaseHas('stock_in', ['transaction_id' => 'TXN-001']);

    // Query activities and check for a matching activity
    $activities = $this->getJson('/api/activities?limit=20');
    $activities->assertStatus(200);
    $items = $activities->json('data');
    // Verify at least one activity mentions 'Stock In' or the product name
    $found = collect($items)->contains(function ($a) use ($item, $user) {
        $desc = strtolower($a['sentence'] ?? $a['description'] ?? $a['action'] ?? '');
        return (strpos($desc, 'stock in') !== false || strpos($desc, strtolower($item->name)) !== false) && (!empty($a['actor']) && ($a['actor']['id'] ?? null) === $user->id);
    });
    expect($found)->toBeTrue();
});
