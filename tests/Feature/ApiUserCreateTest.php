<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // ensure roles exist for tests
    Role::firstOrCreate(['name' => 'Office Assistant', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
});

test('api create user assigns spatie role instead of writing legacy columns', function () {
    $email = 'vincent.test@example.com';

    $payload = [
        'name' => 'Vincent Test',
        'email' => $email,
        'role' => 'Office Assistant',
        'is_admin' => false,
    ];

    $resp = $this->postJson('/api/users', $payload);
    $resp->assertStatus(201);

    $u = User::where('email', $email)->first();
    expect($u)->not->toBeNull();
    expect($u->hasRole('Office Assistant'))->toBeTrue();
});

test('api create user with is_admin true maps to Administrator role when no role provided', function () {
    $email = 'admin.test@example.com';

    $payload = [
        'name' => 'Admin Test',
        'email' => $email,
        'is_admin' => true,
    ];

    $resp = $this->postJson('/api/users', $payload);
    $resp->assertStatus(201);

    $u = User::where('email', $email)->first();
    expect($u)->not->toBeNull();
    expect($u->hasRole('System Admin'))->toBeTrue();
});
