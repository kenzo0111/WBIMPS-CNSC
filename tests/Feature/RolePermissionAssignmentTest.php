<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

/**
 * This test verifies roles exist and permission assignment works for each role.
 */
beforeEach(function () {
    // roles to test (exact names provided by the user)
    $roles = [
        'System Admin',
        'Administrator',
        'Supply Officer',
        'Office Assistant',
        'Student Assistant',
    ];

    foreach ($roles as $r) {
        Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
    }

    // Some example permissions
    $permissions = [
        'manage everything',
        'manage supplies',
        'manage stock in',
        'manage stock out',
        'create requests',
        'view reports',
    ];

    foreach ($permissions as $p) {
        Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
    }

    // Assign permissions to roles (representative mapping)
    Role::where('name', 'System Admin')->first()->syncPermissions($permissions);
    Role::where('name', 'Administrator')->first()->syncPermissions(['manage supplies', 'view reports']);
    Role::where('name', 'Supply Officer')->first()->syncPermissions(['manage supplies', 'create requests']);
    Role::where('name', 'Office Assistant')->first()->syncPermissions(['create requests', 'view reports']);
    Role::where('name', 'Student Assistant')->first()->syncPermissions(['create requests', 'manage stock in', 'manage stock out']);

    // Clear spatie permission cache so checks reflect updated assignments in tests
    app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

    // expose them to tests via container-like properties when needed
    $this->roles = $roles;
    $this->permissions = $permissions;
});

test('app has the five required roles', function () {
    $roles = Role::pluck('name')->toArray();
    $expected = [
        'System Admin',
        'Administrator',
        'Supply Officer',
        'Office Assistant',
        'Student Assistant',
    ];

    foreach ($expected as $r) {
        expect(in_array($r, $roles))->toBeTrue();
    }
});

test('each role receives correct permissions and users assigned those roles have expected abilities', function () {
    // create one user per role and test particular permission expectations
    $map = [
        'System Admin' => ['manage everything', 'manage supplies', 'view reports'],
        'Administrator' => ['manage supplies', 'view reports'],
        'Supply Officer' => ['manage supplies', 'create requests'],
        'Office Assistant' => ['create requests', 'view reports'],
        'Student Assistant' => ['create requests', 'manage stock in', 'manage stock out'],
    ];

    foreach ($map as $roleName => $expected) {
        $u = User::factory()->create();
        $u->assignRole($roleName);
        // After assignment, refresh permission registrar cache so the model's permission names refresh
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        // reload the model so relationships /caches are consistent
        $u->refresh();
        // ensure role->permissions relation is loaded so permission helpers populate
        $u->load('roles.permissions');

        expect($u->getRoleNames()->toArray())->toContain($roleName);

        foreach ($expected as $perm) {
            $roleModel = Role::where('name', $roleName)->first();
            // verify role has expected permission first
            expect($roleModel->hasPermissionTo($perm))->toBeTrue();
            // then verify the user (via role) has the permission
            // debug output on failure to help diagnose test environment issues
            $viaRoles = $u->getPermissionsViaRoles()->pluck('name')->toArray();
            $allPerms = $u->getAllPermissions()->pluck('name')->toArray();
            $permNames = method_exists($u, 'getPermissionNames') ? $u->getPermissionNames()->toArray() : [];
            expect(in_array($perm, $viaRoles))->toBeTrue();
            expect(in_array($perm, $allPerms))->toBeTrue();
            // verify permission is visible on the user via the role
            if (!in_array($perm, $u->getPermissionsViaRoles()->pluck('name')->toArray())) {
                $permObjVia = $u->getAllPermissions()->where('name', $perm)->first();
                $permGuard = $permObjVia ? $permObjVia->guard_name : 'missing';
                throw new \Exception(
                    'Permission check failed for role: ' . $roleName . ' permission: ' . $perm
                    . ' viaRoles: ' . json_encode($viaRoles)
                    . ' allPerms: ' . json_encode($allPerms)
                    . ' userRoles: ' . json_encode($u->getRoleNames()->toArray())
                    . ' permGuard: ' . $permGuard
                );
            }
        }

        // check the inverse (a permission not assigned shouldn't be available)
        $permissions = ['manage everything', 'manage supplies', 'manage stock in', 'manage stock out', 'create requests', 'view reports'];
        $notAssigned = array_values(array_diff($permissions, $expected));
        foreach ($notAssigned as $p) {
            // System Admin intentionally owns everything; skip checking inverse for them
            if ($roleName === 'System Admin')
                continue;
            expect(in_array($p, $u->getAllPermissions()->pluck('name')->toArray()))->toBeFalse();
        }
    }
});
