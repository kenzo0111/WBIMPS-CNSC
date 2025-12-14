<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run()
    {
        Supplier::create([
            'name' => 'Manila Office Supplies Co.',
            'address' => '123 Rizal Avenue, Makati City, Metro Manila',
            'tin' => '123-456-789-000',
            'contact' => '+63-917-123-4567',
            'email' => 'contact@manilaofficesupplies.com',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
        ]);

        Supplier::create([
            'name' => 'Cebu Tech Parts Inc.',
            'address' => '456 Osmena Boulevard, Cebu City, Cebu',
            'tin' => '987-654-321-000',
            'contact' => '+63-918-987-6543',
            'email' => 'info@cebutechparts.com',
            'latitude' => 10.3157,
            'longitude' => 123.8854,
        ]);

        Supplier::create([
            'name' => 'Davao Quality Materials Ltd.',
            'address' => '789 Roxas Avenue, Davao City, Davao del Sur',
            'tin' => '456-789-012-000',
            'contact' => '+63-919-456-7890',
            'email' => 'sales@davaoquality.com',
            'latitude' => 7.1907,
            'longitude' => 125.4553,
        ]);

        Supplier::create([
            'name' => 'Baguio Stationery Supplies',
            'address' => '321 Session Road, Baguio City, Benguet',
            'tin' => '321-654-987-000',
            'contact' => '+63-920-321-0987',
            'email' => 'info@baguio stationery.com',
            'latitude' => 16.4023,
            'longitude' => 120.5960,
        ]);
    }
}