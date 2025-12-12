<?php

use App\Models\User;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    $user = User::factory()->create(['status' => 'active']);
    $this->actingAs($user, 'web');
    Mail::fake();
});

test('purchase request submission notifies approvers (placeholder)', function () {
    // TODO: Implement notification assertions (Mail::assertSent, Notification::assertNotified)
    expect(true)->toBeTrue();
});
