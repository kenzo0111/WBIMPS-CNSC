<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

uses(RefreshDatabase::class);

test('spatie activity log api accepts and returns activities', function () {
    // Create and authenticate a user
    $user = User::factory()->create();
    $this->actingAs($user);

    // Post a new activity via API
    $payload = ['action' => 'Test activity from API', 'meta' => ['test_key' => 'test_value']];
    $response = $this->postJson('/api/activities', $payload);
    $response->assertStatus(201);
    $data = $response->json('data');
    expect($data)->not->toBeNull();
    expect($data['description'] ?? $data['action'] ?? null)->toBe('Test activity from API');
    // Actor should be present and map the acting user
    expect($data['actor'] ?? null)->not->toBeNull();
    expect(($data['actor']['id'] ?? null) === $user->id)->toBeTrue();

    // Fetch recent activities and verify presence
    $list = $this->getJson('/api/activities?limit=5');
    $list->assertStatus(200);
    $items = $list->json('data');
    expect(count($items))->toBeGreaterThan(0);
    expect(collect($items)->pluck('description')->contains('Test activity from API'))->toBeTrue();
});
