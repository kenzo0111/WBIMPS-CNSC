<?php

namespace Database\Factories;

use App\Models\StockIn;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockIn>
 */
class StockInFactory extends Factory
{
    protected $model = StockIn::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transaction_id' => 'SI-'.date('Y').'-'.fake()->unique()->numberBetween(1000, 9999),
            'sku' => 'SKU-'.fake()->unique()->numberBetween(10000, 99999),
            'product_name' => fake()->words(3, true),
            'quantity' => fake()->numberBetween(10, 100),
            'unit_cost' => fake()->randomFloat(2, 50, 5000),
            'supplier' => fake()->company(),
            'date_received' => fake()->date(),
            'received_by' => fake()->name(),
        ];
    }
}
