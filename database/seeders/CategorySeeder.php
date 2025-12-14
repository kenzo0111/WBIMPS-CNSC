<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'code' => 'E',
                'name' => 'Expendable',
                'description' => 'Expendable items are consumables that lose their identity or are fully used within a year. They are low-cost assets with a short lifespan that do not require individual long-term tracking once issued.',
            ],
            [
                'code' => 'SL',
                'name' => 'Semi Expendable (Low)',
                'description' => 'Semi-expendable items are durable products that last more than one year and have a minimal acquisition cost. They do not require stringent tracking but are monitored for inventory control until they are broken or unserviceable.',
            ],
            [
                'code' => 'SH',
                'name' => 'Semi Expendable (High)',
                'description' => 'Semi-Expendables are tangible assets valued below the capital asset barrier, precisely below ₱50,000 according to government criteria. They are defined as durable objects with a useful life surpassing one year.',
            ],
            [
                'code' => 'N',
                'name' => 'Non-Expendable',
                'description' => 'High-value assets classified as Property, Plant, and Equipment (PPE) have a long useful life (over one year) and exceed a capitalization threshold (e.g., ₱50,000). These long-term investments are tracked using a Property Acknowledgment Receipt (PAR) and are subject to annual depreciation.',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['code' => $category['code']],
                $category
            );
        }
    }
}