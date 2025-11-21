<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Item>
 */
class ItemFactory extends Factory
{
    protected $model = Item::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sku' => 'SKU-'.fake()->unique()->numberBetween(10000, 99999),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'quantity' => fake()->numberBetween(10, 1000),
            'unit' => fake()->randomElement(['pcs', 'box', 'pack', 'unit', 'kg', 'liter']),
            'unit_cost' => fake()->randomFloat(2, 10, 1000),
            'category_id' => Category::factory(),
            'date' => fake()->date(),
        ];
    }

    /**
     * Indicate that the item has low stock.
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'quantity' => fake()->numberBetween(1, 10),
        ]);
    }

    /**
     * Indicate that the item is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'quantity' => 0,
        ]);
    }
}
