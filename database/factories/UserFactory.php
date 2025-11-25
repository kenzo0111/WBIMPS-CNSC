<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'status' => 'active',
        ];
    }

    /**
     * Indicate that the user is an admin.
     */
    public function admin(): static
    {
        // Mark the model as admin (legacy columns) and ensure the spatie role is assigned
        return $this->state(fn(array $attributes) => [
            // keep only status/behavior in the factory — roles are assigned via spatie after creating
        ])->afterCreating(function (\App\Models\User $user) {
            if (method_exists($user, 'assignRole')) {
                // make sure admin role exists in tests / fresh DB then assign
                \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin'], ['slug' => 'admin', 'guard_name' => 'web']);
                $user->assignRole('admin');
            }
        });
    }

    /**
     * Indicate that the user is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
