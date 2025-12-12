<?php

use App\Models\PurchaseRequest;
use App\Models\User;

beforeEach(function () {
    $user = User::factory()->create(['status' => 'active']);
    $this->actingAs($user, 'web');
});

test('create purchase order from approved purchase request (placeholder)', function () {
    // TODO: Implement full flow: approve PR, convert to PO, assert saved PO data
    expect(true)->toBeTrue();
});
