<?php

namespace Database\Factories;

use App\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    protected $model = PurchaseOrder::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $items = [];
        $itemCount = fake()->numberBetween(1, 5);
        $grandTotal = 0;

        for ($i = 0; $i < $itemCount; $i++) {
            $quantity = fake()->numberBetween(1, 50);
            $unitCost = fake()->randomFloat(2, 100, 10000);
            $totalCost = $quantity * $unitCost;
            $grandTotal += $totalCost;

            $items[] = [
                'name' => fake()->words(3, true),
                'quantity' => $quantity,
                'unit' => fake()->randomElement(['pcs', 'box', 'pack', 'unit', 'set']),
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
            ];
        }

        return [
            'po_number' => 'PO-'.date('Y').'-'.fake()->unique()->numberBetween(1000, 9999),
            'supplier' => fake()->company(),
            'supplier_address' => fake()->address(),
            'date_of_purchase' => fake()->date(),
            'tin_number' => fake()->numerify('###-###-###-###'),
            'mode_of_procurement' => fake()->randomElement(['Public Bidding', 'Negotiated', 'Shopping', 'Direct Contracting']),
            'place_of_delivery' => fake()->randomElement(['Main Office', 'Branch Office', 'Warehouse']),
            'delivery_term' => fake()->randomElement(['15 days', '30 days', '45 days', '60 days']),
            'date_of_delivery' => fake()->dateTimeBetween('now', '+60 days')->format('Y-m-d'),
            'payment_term' => fake()->randomElement(['Cash', 'Net 30', 'Net 60', 'COD']),
            'items' => $items,
            'grand_total' => round($grandTotal, 2),
            'fund_cluster' => fake()->numerify('FC-####'),
            'ors_burs_no' => fake()->numerify('ORS-####'),
            'funds_available' => fake()->randomElement(['Yes', 'No']),
            'ors_burs_date' => fake()->date(),
            'ors_burs_amount' => round($grandTotal, 2),
            'entity_name' => 'CNSC Supply System',
            'entity_address' => fake()->address(),
            'status' => fake()->randomElement(['pending', 'approved', 'completed', 'cancelled']),
        ];
    }

    /**
     * Indicate that the purchase order is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the purchase order is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    /**
     * Indicate that the purchase order is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
