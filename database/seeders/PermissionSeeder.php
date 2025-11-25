<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // canonical roles used by the application
        $roles = [
            ['name' => 'System Admin', 'slug' => 'system-admin'],
            ['name' => 'Administrator', 'slug' => 'administrator'],
            ['name' => 'Supply Officer', 'slug' => 'supply-officer'],
            ['name' => 'Office Assistant', 'slug' => 'office-assistant'],
            ['name' => 'Student Assistant', 'slug' => 'student-assistant'],
        ];

        foreach ($roles as $r) {
            Role::firstOrCreate(['slug' => $r['slug']], ['name' => $r['name'], 'guard_name' => 'web']);
        }

        // canonical permissions used by the application
        $permissions = [
            'manage everything',
            'manage categories',
            'manage items',
            'manage supplies',
            'manage stock in',
            'manage stock out',
            'create requests',
            'manage requests',
            'view reports',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        // attach permissions to roles
        $rolePermissions = [
            'System Admin' => $permissions,
            'Administrator' => ['manage categories', 'manage items', 'manage supplies', 'manage requests', 'view reports'],
            'Supply Officer' => ['manage items', 'manage supplies', 'create requests', 'manage requests'],
            'Office Assistant' => ['create requests', 'view reports'],
            'Student Assistant' => ['create requests', 'manage stock in', 'manage stock out'],
        ];

        foreach ($rolePermissions as $roleName => $perms) {
            $role = Role::firstWhere('name', $roleName);
            if ($role) {
                $role->syncPermissions($perms);
            }
        }
    }
}
