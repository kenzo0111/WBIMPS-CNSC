<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Item;
use App\Models\User;

uses(RefreshDatabase::class);

test('creating stock-out logs activity and appears in activities api', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $item = Item::factory()->create(['sku' => 'E101', 'name' => 'Pencil', 'quantity' => 100]);

    $payload = [
        'issue_id' => 'ISS-001',
        'transaction_id' => 'TXN-002',
        'sku' => $item->sku,
        'product_name' => $item->name,
        'quantity' => 10,
        'unit_cost' => 5,
        'date_issued' => now()->toDateString(),
    ];

    $response = $this->postJson('/api/stock-out', $payload);
    $response->assertStatus(201);

    // Check that the stock-out was created
    $this->assertDatabaseHas('stock_out', ['issue_id' => 'ISS-001']);

    // Verify activity presence
    $activities = $this->getJson('/api/activities?limit=20');
    $items = $activities->json('data');
    $found = collect($items)->contains(function ($a) use ($item, $user) {
        $desc = strtolower($a['sentence'] ?? $a['description'] ?? $a['action'] ?? '');
        return (strpos($desc, 'stock out') !== false || strpos($desc, strtolower($item->name)) !== false) && (!empty($a['actor']) && ($a['actor']['id'] ?? null) === $user->id);
    });
    expect($found)->toBeTrue();
});
