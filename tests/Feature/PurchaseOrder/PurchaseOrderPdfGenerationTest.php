<?php

use App\Models\PurchaseOrder;
use App\Models\User;

beforeEach(function () {
    $user = User::factory()->create(['status' => 'active']);
    $this->actingAs($user, 'web');
});

test('generate purchase order pdf (placeholder)', function () {
    // TODO: Assert PDF generation and content for a given PO
    expect(true)->toBeTrue();
});
