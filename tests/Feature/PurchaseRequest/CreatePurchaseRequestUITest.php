<?php

use App\Models\User;

beforeEach(function () {
    $user = User::factory()->create(['status' => 'active']);
    $this->actingAs($user, 'web');
});

test('ui can create purchase request (placeholder)', function () {
    // TODO: Implement UI creation flow using Laravel Dusk or simulate server side
    expect(true)->toBeTrue();
});
