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

        // Ensure permissions and roles are created before any user-role assignment
        $this->call([
            \Database\Seeders\PermissionSeeder::class,
            \Database\Seeders\CategorySeeder::class,
            \Database\Seeders\ItemSeeder::class,
            \Database\Seeders\SupplierSeeder::class,
        ]);

        // Ensure there is an admin account that matches the README test credentials
        // Email: admin@example.com  Password/PIN: admin123
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                // AccessController requires status === 'active' to allow login
                'status' => 'active',
            ]
        );

        // assign spatie role as well when the package is present
        if (method_exists($admin, 'assignRole')) {
            // assign the canonical top-level system role
            $admin->assignRole('System Admin');
        }

        // Keep an additional test user for convenience
        $test = User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('123456'),
                'email_verified_at' => now(),
            ]
        );

        if (method_exists($test, 'assignRole')) {
            $test->assignRole('Administrator');
        }

        // Ensure permission roles exist before creating seeded users so they can be attached
        $this->call([
            // ActivitySeeder::class,
            \Database\Seeders\SiteContentSeeder::class,
        ]);
    }
}
