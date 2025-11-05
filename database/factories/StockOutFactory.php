<?php

namespace Database\Factories;

use App\Models\StockOut;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockOut>
 */
class StockOutFactory extends Factory
{
    protected $model = StockOut::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 50);
        $unitCost = fake()->randomFloat(2, 50, 2000);

        return [
            'transaction_id' => 'SO-'.date('Y').'-'.fake()->unique()->numberBetween(1000, 9999),
            'issue_id' => 'ISS-'.date('Y').'-'.fake()->unique()->numberBetween(1000, 9999),
            'sku' => 'SKU-'.fake()->numberBetween(10000, 99999),
            'product_name' => fake()->words(3, true),
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'total_cost' => $quantity * $unitCost,
            'department' => fake()->randomElement(['IT', 'HR', 'Finance', 'Operations', 'Admin']),
            'issued_to' => fake()->name(),
            'issued_by' => fake()->name(),
            'purpose' => fake()->sentence(),
            'status' => fake()->randomElement(['pending', 'approved', 'rejected', 'completed']),
            'date_issued' => fake()->date(),
        ];
    }

    /**
     * Indicate that the stock out is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the stock out is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }
}
