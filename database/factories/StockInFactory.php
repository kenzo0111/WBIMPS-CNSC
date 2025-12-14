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
        $items = \App\Models\Item::all();
        $suppliers = \App\Models\Supplier::all();

        $item = $items->random();
        $supplier = $suppliers->random();

        return [
            'transaction_id' => 'SI-' . date('Y') . '-' . fake()->unique()->numberBetween(1000, 9999),
            'sku' => $item->sku,
            'product_name' => $item->name,
            'quantity' => fake()->numberBetween(1, 50),
            'unit_cost' => $item->unit_cost,
            'supplier' => $supplier->name,
            'date_received' => fake()->dateTimeBetween('2025-01-01', '2025-12-31')->format('Y-m-d'),
            'received_by' => fake()->name(),
            'fund_cluster' => fake()->randomElement(['101', '102', '201', '202']),
        ];
    }
}
