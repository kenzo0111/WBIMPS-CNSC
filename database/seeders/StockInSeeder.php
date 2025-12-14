<?php

namespace Database\Seeders;

use App\Models\StockIn;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class StockInSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data
        StockIn::truncate();

        // Create 10 stock in records using the factory
        StockIn::factory(10)->create();
    }
}