<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ManagementSeeder extends Seeder
{
    /**
     * Seed management users for each canonical role defined in config/roles_permissions.php
     */
    public function run(): void
    {
        $config = config('roles_permissions', []);
        $roles = $config['roles'] ?? [];

        // sensible default; can be overridden with env('SEED_USER_PASSWORD')
        $defaultPassword = env('SEED_USER_PASSWORD', 'password');

        foreach ($roles as $r) {
            $roleName = is_array($r) ? ($r['name'] ?? null) : $r;
            if (!$roleName) {
                continue;
            }

            $slug = is_array($r) ? ($r['slug'] ?? Str::slug($roleName)) : Str::slug($roleName);
            $email = $slug . '@example.com';

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $roleName . ' User',
                    'password' => Hash::make($defaultPassword),
                    'email_verified_at' => now(),
                    'status' => 'active',
                ]
            );

            if (method_exists($user, 'assignRole')) {
                $user->assignRole($roleName);
            }

            // print credential info when running the seeder interactively
            if (isset($this->command)) {
                $this->command->info("Seeded account: {$email} (password: {$defaultPassword}) assigned role: {$roleName}");
            }
        }
    }
}
