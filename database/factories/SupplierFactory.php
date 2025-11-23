<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Supplier>
 */
class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'address' => fake()->address(),
            'tin' => fake()->numerify('###-###-###-###'),
            // produce numeric-only contact by default (11 digits common PH mobile prefix)
            'contact' => fake()->numerify('09#########'),
            'email' => fake()->unique()->safeEmail(),
        ];
    }
}
