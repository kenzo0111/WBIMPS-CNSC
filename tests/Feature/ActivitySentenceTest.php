<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

uses(RefreshDatabase::class);

test('activity api returns human readable sentence', function () {
    $user = User::factory()->create(['name' => 'John Doe']);
    $this->actingAs($user);

    $payload = ['action' => 'PO #1234 approved', 'meta' => ['po' => 'PO #1234']];
    $response = $this->postJson('/api/activities', $payload);
    $response->assertStatus(201);
    $data = $response->json('data');
    expect($data)->not->toBeNull();
    expect(isset($data['sentence']))->toBeTrue();
    // sentence includes the verb 'approved' and PO identifier; actor ID is validated separately
    expect(stripos($data['sentence'], 'approved') !== false)->toBeTrue();
    expect(stripos($data['sentence'], 'PO') !== false || stripos($data['sentence'], '#1234') !== false)->toBeTrue();
    // The actor field should be present and map to the user
    expect(isset($data['actor']) && $data['actor']['id'] === $user->id)->toBeTrue();
});
