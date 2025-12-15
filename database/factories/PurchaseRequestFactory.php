<?php

namespace Database\Factories;

use App\Models\PurchaseRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PurchaseRequest>
 */
class PurchaseRequestFactory extends Factory
{
    protected $model = PurchaseRequest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $items = [];
        $itemCount = fake()->numberBetween(1, 5);

        for ($i = 0; $i < $itemCount; $i++) {
            $items[] = [
                'name' => fake()->words(3, true),
                'quantity' => fake()->numberBetween(1, 100),
                'unit' => fake()->randomElement(['pcs', 'box', 'pack', 'unit']),
                'unit_cost' => fake()->randomFloat(2, 10, 1000),
            ];
        }

        // choose the first item values as the top-level quantity/unit_cost so tests that rely on them work
        $first = $items[0] ?? ['quantity' => 1, 'unit_cost' => 0];

        return [
            'request_id' => date('Y-m') . '-' . str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'email' => fake()->safeEmail(),
            'requester' => fake()->name(),
            'department' => fake()->randomElement(['IT', 'HR', 'Finance', 'Operations', 'Admin']),
            'items' => json_encode($items),
            'unit' => fake()->randomElement(['pcs', 'box', 'pack', 'unit']),
            'quantity' => $first['quantity'],
            'unit_cost' => $first['unit_cost'],
            'total_cost' => round($first['quantity'] * $first['unit_cost'], 2),
            'needed_date' => fake()->dateTimeBetween('now', '+30 days'),
            'purpose' => fake()->sentence(8),
            'priority' => fake()->randomElement(['Low', 'Medium', 'High']),
            'status' => 'Incoming',
            'submitted_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }

    /**
     * Indicate that the purchase request is pending.
     */
    public function pending(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the purchase request is approved.
     */
    public function approved(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'approved',
        ]);
    }

    /**
     * Indicate that the purchase request is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'rejected',
        ]);
    }

    /**
     * Indicate that the purchase request is completed.
     */
    public function completed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
