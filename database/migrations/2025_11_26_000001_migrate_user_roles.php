<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('roles') || !Schema::hasTable('model_has_roles')) {
            // Roles tables not yet present — migration order must ensure spatie tables exist first
            return;
        }

        // helper to slugify role names
        $slugify = function (string $value): string {
            return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $value), '-'));
        };

        // Insert roles for any distinct values stored in users.role
        $distinctRoles = DB::table('users')->whereNotNull('role')->distinct()->pluck('role')->filter()->unique()->values();

        foreach ($distinctRoles as $roleName) {
            $slug = $slugify($roleName);
            // ensure role exists
            $existing = DB::table('roles')->where('slug', $slug)->orWhere('name', $roleName)->first();
            if (!$existing) {
                $id = DB::table('roles')->insertGetId([
                    'name' => (string) $roleName,
                    'slug' => $slug,
                    'guard_name' => 'web',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $id = $existing->id;
            }

            // attach users with this role
            $users = DB::table('users')->where('role', $roleName)->pluck('id');
            foreach ($users as $uid) {
                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $id,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $uid,
                ]);
            }
        }

        // If users had is_admin flag, create/attach a dedicated 'admin' role
        $adminUsers = DB::table('users')->where('is_admin', true)->pluck('id');
        if ($adminUsers->isNotEmpty()) {
            $adminRole = DB::table('roles')->where('slug', 'admin')->orWhere('name', 'admin')->first();
            if (!$adminRole) {
                $adminRoleId = DB::table('roles')->insertGetId([
                    'name' => 'admin',
                    'slug' => 'admin',
                    'guard_name' => 'web',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $adminRoleId = $adminRole->id;
            }

            foreach ($adminUsers as $uid) {
                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $adminRoleId,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $uid,
                ]);
            }
        }

        // Note: we keep legacy `role` and `is_admin` columns for backwards compatibility
    }

    public function down(): void
    {
        // We don't remove role assignments during rollback automatically (safe-noop)
    }
};
