<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('system admin is considered admin', function () {
    // Create System Admin role
    Role::create(['name' => 'System Admin', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('System Admin');

    expect($user->isAdmin())->toBeTrue();
});

test('administrator is not implicitly admin anymore', function () {
    // Create Administrator role
    Role::create(['name' => 'Administrator', 'guard_name' => 'web']);

    $user = User::factory()->create();
    $user->assignRole('Administrator');

    // This was the key change: Administrator is no longer hardcoded in isAdmin()
    expect($user->isAdmin())->toBeFalse();
});

test('purchase request observer query finds system admins and users with permission', function () {
    // Setup roles and permissions
    Role::create(['name' => 'System Admin', 'guard_name' => 'web']);
    Role::create(['name' => 'Administrator', 'guard_name' => 'web']);
    Permission::create(['name' => 'manage requests', 'guard_name' => 'web']);

    // User A: System Admin
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    $admin->assignRole('System Admin');

    // User B: Administrator (initially no permissions)
    $manager = User::factory()->create(['email' => 'manager@example.com']);
    $manager->assignRole('Administrator');

    // User C: Regular user
    $user = User::factory()->create(['email' => 'user@example.com']);

    // The query logic from PurchaseRequestObserver
    $getRecipients = function () {
        return User::whereHas('roles', function ($q) {
            $q->where('name', 'System Admin');
        })->orWhere(function ($q) {
            $q->permission('manage requests');
        })->pluck('email')->toArray();
    };

    // Initially, only System Admin should be found
    $recipients = $getRecipients();
    expect($recipients)->toContain('admin@example.com');
    expect($recipients)->not->toContain('manager@example.com');
    expect($recipients)->not->toContain('user@example.com');

    // Give Administrator the permission
    $manager->givePermissionTo('manage requests');

    // Now Administrator should also be found
    $recipients = $getRecipients();
    expect($recipients)->toContain('admin@example.com');
    expect($recipients)->toContain('manager@example.com');
    expect($recipients)->not->toContain('user@example.com');
});
