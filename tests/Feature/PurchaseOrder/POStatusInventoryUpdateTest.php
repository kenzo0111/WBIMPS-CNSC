<?php

use App\Models\PurchaseOrder;
use App\Models\User;

beforeEach(function () {
    $user = User::factory()->create(['status' => 'active']);
    $this->actingAs($user, 'web');
});

test('updating purchase order to received updates inventory and IARs (placeholder)', function () {
    // TODO: Implement assertions for inventory quantity updates and IAR status
    expect(true)->toBeTrue();
});
