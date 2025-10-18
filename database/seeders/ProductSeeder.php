<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;

class ProductSeeder extends Seeder
{
    public function run()
    {
        // Create some sample categories if they don't exist
        $officeSupplies = Category::firstOrCreate(
            ['name' => 'Office Supplies'],
            ['description' => 'General office supplies and stationery']
        );

        $itEquipment = Category::firstOrCreate(
            ['name' => 'IT Equipment'],
            ['description' => 'Information technology equipment and accessories']
        );

        $cleaningSupplies = Category::firstOrCreate(
            ['name' => 'Cleaning Supplies'],
            ['description' => 'Cleaning and maintenance supplies']
        );

        // Create sample products
        Product::create([
            'sku' => 'PEN001',
            'name' => 'Ballpoint Pen',
            'description' => 'Blue ballpoint pen, standard size',
            'category_id' => $officeSupplies->id,
            'quantity' => 100,
            'unit' => 'pieces',
            'unit_cost' => 15.00,
            'date' => now()->format('Y-m-d')
        ]);

        Product::create([
            'sku' => 'PPR001',
            'name' => 'A4 Paper',
            'description' => 'White A4 paper, 80gsm, 500 sheets per ream',
            'category_id' => $officeSupplies->id,
            'quantity' => 50,
            'unit' => 'reams',
            'unit_cost' => 120.00,
            'date' => now()->format('Y-m-d')
        ]);

        Product::create([
            'sku' => 'KB001',
            'name' => 'USB Keyboard',
            'description' => 'Wired USB keyboard with numeric keypad',
            'category_id' => $itEquipment->id,
            'quantity' => 25,
            'unit' => 'pieces',
            'unit_cost' => 450.00,
            'date' => now()->format('Y-m-d')
        ]);

        Product::create([
            'sku' => 'MS001',
            'name' => 'Optical Mouse',
            'description' => 'Wired optical mouse, USB connection',
            'category_id' => $itEquipment->id,
            'quantity' => 30,
            'unit' => 'pieces',
            'unit_cost' => 250.00,
            'date' => now()->format('Y-m-d')
        ]);

        Product::create([
            'sku' => 'CLN001',
            'name' => 'All-Purpose Cleaner',
            'description' => 'Multi-surface cleaner, 1 liter bottle',
            'category_id' => $cleaningSupplies->id,
            'quantity' => 20,
            'unit' => 'bottles',
            'unit_cost' => 85.00,
            'date' => now()->format('Y-m-d')
        ]);

        Product::create([
            'sku' => 'TON001',
            'name' => 'Printer Toner Cartridge',
            'description' => 'Black toner cartridge for laser printer',
            'category_id' => $officeSupplies->id,
            'quantity' => 15,
            'unit' => 'pieces',
            'unit_cost' => 1200.00,
            'date' => now()->format('Y-m-d')
        ]);
    }
}