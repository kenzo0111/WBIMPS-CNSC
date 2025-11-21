<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Ensure there is an admin account that matches the README test credentials
        // Email: admin@example.com  Password/PIN: admin123
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                // AccessController requires status === 'active' to allow login
                'status' => 'active',
                'role' => 'Administrator',
                'department' => 'Admin',
                'is_admin' => true,
            ]
        );

        // Keep an additional test user for convenience
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('123456'),
                'email_verified_at' => now(),
                'role' => 'Administrator',
                'department' => 'Admin',
                'is_admin' => true,
            ]
        );

        $this->call([
            ProductSeeder::class,
            ActivitySeeder::class,
        ]);
    }
}
