<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    // make sure canonical permissions / roles exist for tests
    Permission::firstOrCreate(['name' => 'manage items', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'manage stock in', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'manage stock out', 'guard_name' => 'web']);

    Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Student Assistant', 'guard_name' => 'web']);

    // ensure System Admin has manage items and everything
    $sa = Role::firstWhere('name', 'System Admin');
    $sa->syncPermissions(['manage items', 'manage stock in', 'manage stock out']);

    $st = Role::firstWhere('name', 'Student Assistant');
    $st->syncPermissions(['manage stock in', 'manage stock out']);
});

test('dashboard includes permissionNames for system admin', function () {
    $user = User::factory()->create();
    $user->assignRole('System Admin');

    $resp = $this->actingAs($user)->get('/admin/dashboard');
    $resp->assertStatus(200);

    // window.CURRENT_USER JSON must include manage items for system admin
    $resp->assertSee('manage items');
});

test('student assistant dashboard includes stock permissions but not manage items', function () {
    $user = User::factory()->create();
    $user->assignRole('Student Assistant');

    $resp = $this->actingAs($user)->get('/admin/dashboard');
    $resp->assertStatus(200);

    $resp->assertSee('manage stock in');
    $resp->assertSee('manage stock out');
    $resp->assertDontSee('manage items');
});

test('office assistant dashboard includes create requests and view reports permissions', function () {
    $user = User::factory()->create();
    // ensure role and permissions exist and are associated
    Permission::firstOrCreate(['name' => 'create requests', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'view reports', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Office Assistant', 'guard_name' => 'web']);
    $role = Role::firstWhere('name', 'Office Assistant');
    $role->syncPermissions(['create requests', 'view reports']);

    $user->assignRole('Office Assistant');
    $resp = $this->actingAs($user)->get('/admin/dashboard');
    $resp->assertStatus(200);
    $resp->assertSee('create requests');
    $resp->assertSee('view reports');
});
