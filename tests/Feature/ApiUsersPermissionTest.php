<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    // Ensure canonical permissions and role exist
    Permission::firstOrCreate(['name' => 'create requests', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'view reports', 'guard_name' => 'web']);

    Role::firstOrCreate(['name' => 'Office Assistant', 'guard_name' => 'web']);

    $role = Role::firstWhere('name', 'Office Assistant');
    $role->syncPermissions(['create requests', 'view reports']);
});

test('api users list includes permissionNames for office assistant users', function () {
    $user = User::factory()->create();
    $user->assignRole('Office Assistant');

    $resp = $this->getJson('/api/users');
    $resp->assertStatus(200);

    $body = $resp->json();
    // ensure at least one user has permissionNames and our test user has the expected perms
    $match = collect($body)->firstWhere('id', $user->id);
    expect($match)->not->toBeNull();
    expect($match['permissionNames'])->toBeArray();
    expect(in_array('create requests', $match['permissionNames']))->toBeTrue();
    expect(in_array('view reports', $match['permissionNames']))->toBeTrue();
});

test('api user show returns permissionNames and update persists role', function () {
    $user = User::factory()->create();

    // user has no role initially
    $resp = $this->getJson("/api/users/{$user->id}");
    $resp->assertStatus(200);
    $payload = $resp->json();
    expect($payload['permissionNames'])->toBeArray();

    // update user to Office Assistant role
    $updateResp = $this->putJson("/api/users/{$user->id}", [
        'name' => $user->name,
        'email' => $user->email,
        'role' => 'Office Assistant',
    ]);

    $updateResp->assertStatus(200);
    $data = $updateResp->json();
    expect(isset($data['user']))->toBeTrue();
    expect(in_array('create requests', $data['user']['permissionNames']))->toBeTrue();
});
