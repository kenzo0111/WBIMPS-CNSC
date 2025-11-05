<?php

namespace Database\Factories;

use App\Models\PurchaseRequest;
use App\Models\User;
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

        return [
            'request_id' => 'REQ-'.date('Y').'-'.fake()->unique()->numberBetween(1000, 9999),
            'email' => fake()->safeEmail(),
            'requester' => fake()->name(),
            'department' => fake()->randomElement(['IT', 'HR', 'Finance', 'Operations', 'Admin']),
            'items' => json_encode($items),
            'unit' => fake()->randomElement(['pcs', 'box', 'pack', 'unit']),
            'needed_date' => fake()->dateTimeBetween('now', '+30 days'),
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
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the purchase request is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    /**
     * Indicate that the purchase request is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }

    /**
     * Indicate that the purchase request is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
