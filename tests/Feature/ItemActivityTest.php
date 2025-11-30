<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Item;
use App\Models\User;

uses(RefreshDatabase::class);

test('item create/update/delete logs activities', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Create
    $payload = [
        'sku' => 'E999',
        'name' => 'Test Item',
        'quantity' => 10,
        'unit_cost' => 100,
    ];
    $resp = $this->postJson('/api/items', $payload);
    $resp->assertStatus(201);
    $item = Item::where('sku', 'E999')->first();
    expect($item)->not->toBeNull();

    // Verify creation activity
    $activities = $this->getJson('/api/activities?limit=20');
    $items = $activities->json('data');
    $foundCreate = collect($items)->contains(function ($a) use ($item, $user) {
        $desc = strtolower($a['sentence'] ?? $a['description'] ?? $a['action'] ?? '');
        return (strpos($desc, 'item created') !== false || strpos($desc, strtolower($item->name)) !== false) && (!empty($a['actor']) && ($a['actor']['id'] ?? null) === $user->id);
    });
    expect($foundCreate)->toBeTrue();

    // Update
    $this->putJson("/api/items/{$item->id}", ['sku' => 'E999', 'name' => 'Test Item Updated', 'quantity' => 12, 'unit_cost' => 110])->assertStatus(200);
    $activities = $this->getJson('/api/activities?limit=30');
    $items = $activities->json('data');
    $foundUpdate = collect($items)->contains(function ($a) use ($item, $user) {
        $desc = strtolower($a['sentence'] ?? $a['description'] ?? $a['action'] ?? '');
        return (strpos($desc, 'item updated') !== false || strpos($desc, 'updated') !== false) && (!empty($a['actor']) && ($a['actor']['id'] ?? null) === $user->id);
    });
    expect($foundUpdate)->toBeTrue();

    // Delete
    $this->deleteJson("/api/items/{$item->id}")->assertStatus(200);
    $activities = $this->getJson('/api/activities?limit=50');
    $items = $activities->json('data');
    $foundDelete = collect($items)->contains(function ($a) use ($item, $user) {
        $desc = strtolower($a['sentence'] ?? $a['description'] ?? $a['action'] ?? '');
        return (strpos($desc, 'item deleted') !== false || strpos($desc, strtolower($item->name)) !== false) && (!empty($a['actor']) && ($a['actor']['id'] ?? null) === $user->id);
    });
    expect($foundDelete)->toBeTrue();
});
