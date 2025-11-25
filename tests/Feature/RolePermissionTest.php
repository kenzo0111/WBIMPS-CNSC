<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Ensure five example roles exist in the test DB so the assertion is stable
    $this->roles = [
        'admin',
        'head officer',
        'employee',
        'procurement',
        'viewer',
    ];

    foreach ($this->roles as $r) {
        Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
    }
});

test('there are at least five roles available', function () {
    $count = Role::count();
    expect($count)->toBeGreaterThanOrEqual(5);
});

test('assigning a role to a user works and hasRole returns true', function () {
    $user = User::factory()->create();

    // assign the admin role and assert the trait reports it
    $user->assignRole('admin');

    expect($user->hasRole('admin'))->toBeTrue();
    expect($user->getRoleNames())->toContain('admin');
});
