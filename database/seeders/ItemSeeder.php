<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    public function run()
    {
        // Create some sample categories if they don't exist
        $categories = [
            [
                'name' => 'Office Supplies',
                'description' => 'General office supplies and stationery',
                'code' => 'E', // Expendable
                'items' => [
                    ['name' => 'Ballpoint Pen', 'description' => 'Blue ballpoint pen, standard size', 'quantity' => 100, 'unit' => 'pieces', 'unit_cost' => 15.00],
                    ['name' => 'A4 Paper', 'description' => 'White A4 paper, 80gsm, 500 sheets per ream', 'quantity' => 50, 'unit' => 'reams', 'unit_cost' => 120.00],
                    ['name' => 'Printer Toner Cartridge', 'description' => 'Black toner cartridge for laser printer', 'quantity' => 15, 'unit' => 'pieces', 'unit_cost' => 1200.00],
                    ['name' => 'Paper Clips', 'description' => 'Standard paper clips, 100 pieces per box', 'quantity' => 200, 'unit' => 'boxes', 'unit_cost' => 25.00],
                    ['name' => 'Stapler', 'description' => 'Heavy-duty stapler with staples included', 'quantity' => 15, 'unit' => 'pieces', 'unit_cost' => 180.00],
                    ['name' => 'Wall Calendar', 'description' => 'Monthly wall calendar, A3 size', 'quantity' => 25, 'unit' => 'pieces', 'unit_cost' => 75.00],
                    ['name' => 'Notebook', 'description' => 'Spiral notebook, A5 size, 100 pages', 'quantity' => 60, 'unit' => 'pieces', 'unit_cost' => 45.00],
                    ['name' => 'Highlighter Pens', 'description' => 'Assorted color highlighter pens, 4-pack', 'quantity' => 40, 'unit' => 'packs', 'unit_cost' => 85.00],
                    ['name' => 'Sticky Notes', 'description' => 'Yellow sticky notes, 100 sheets per pad', 'quantity' => 80, 'unit' => 'pads', 'unit_cost' => 35.00],
                    ['name' => 'Envelopes', 'description' => 'White business envelopes, A4 size', 'quantity' => 100, 'unit' => 'pieces', 'unit_cost' => 8.00],
                    ['name' => 'Binder Clips', 'description' => 'Assorted size binder clips, 50 pieces per box', 'quantity' => 30, 'unit' => 'boxes', 'unit_cost' => 45.00],
                    ['name' => 'Whiteboard Markers', 'description' => 'Dry erase markers, assorted colors, 4-pack', 'quantity' => 25, 'unit' => 'packs', 'unit_cost' => 120.00],
                ]
            ],
            [
                'name' => 'IT Equipment',
                'description' => 'Information technology equipment and accessories',
                'code' => 'SE', // Semi Expendable
                'items' => [
                    ['name' => 'USB Keyboard', 'description' => 'Wired USB keyboard with numeric keypad', 'quantity' => 25, 'unit' => 'pieces', 'unit_cost' => 450.00],
                    ['name' => 'Optical Mouse', 'description' => 'Wired optical mouse, USB connection', 'quantity' => 30, 'unit' => 'pieces', 'unit_cost' => 250.00],
                    ['name' => 'LCD Monitor', 'description' => '24-inch LCD monitor, 1080p resolution', 'quantity' => 20, 'unit' => 'pieces', 'unit_cost' => 3200.00],
                    ['name' => 'USB Flash Drive', 'description' => '16GB USB 2.0 flash drive', 'quantity' => 40, 'unit' => 'pieces', 'unit_cost' => 150.00],
                    ['name' => 'Laser Printer', 'description' => 'Color laser printer, A4 size', 'quantity' => 5, 'unit' => 'pieces', 'unit_cost' => 15000.00],
                    ['name' => 'Document Scanner', 'description' => 'Flatbed document scanner, A4 size', 'quantity' => 3, 'unit' => 'pieces', 'unit_cost' => 8500.00],
                    ['name' => 'External Hard Drive', 'description' => '1TB external USB hard drive', 'quantity' => 15, 'unit' => 'pieces', 'unit_cost' => 1200.00],
                    ['name' => 'Wireless Router', 'description' => 'Wi-Fi 6 wireless router', 'quantity' => 8, 'unit' => 'pieces', 'unit_cost' => 2500.00],
                ]
            ],
            [
                'name' => 'Cleaning Supplies',
                'description' => 'Cleaning and maintenance supplies',
                'code' => 'E', // Expendable
                'items' => [
                    ['name' => 'All-Purpose Cleaner', 'description' => 'Multi-surface cleaner, 1 liter bottle', 'quantity' => 20, 'unit' => 'bottles', 'unit_cost' => 85.00],
                    ['name' => 'Cleaning Wipes', 'description' => 'Disinfectant cleaning wipes, 100 pieces per canister', 'quantity' => 30, 'unit' => 'canisters', 'unit_cost' => 120.00],
                    ['name' => 'Toilet Paper', 'description' => '2-ply toilet paper, 12 rolls per pack', 'quantity' => 50, 'unit' => 'packs', 'unit_cost' => 180.00],
                    ['name' => 'Trash Bags', 'description' => 'Black trash bags, 30 liters, 50 pieces per box', 'quantity' => 40, 'unit' => 'boxes', 'unit_cost' => 150.00],
                    ['name' => 'Disinfectant Spray', 'description' => 'Surface disinfectant spray, 500ml bottle', 'quantity' => 25, 'unit' => 'bottles', 'unit_cost' => 95.00],
                    ['name' => 'Floor Cleaner', 'description' => 'Hard floor cleaner, 5 liter container', 'quantity' => 15, 'unit' => 'containers', 'unit_cost' => 250.00],
                ]
            ],
            [
                'name' => 'Furniture',
                'description' => 'Office furniture and seating',
                'code' => 'N', // Non-Expendable
                'items' => [
                    ['name' => 'Office Chair', 'description' => 'Ergonomic office chair with adjustable height', 'quantity' => 10, 'unit' => 'pieces', 'unit_cost' => 2500.00],
                    ['name' => 'Office Desk', 'description' => 'Wooden office desk, standard size', 'quantity' => 5, 'unit' => 'pieces', 'unit_cost' => 3500.00],
                    ['name' => 'Filing Cabinet', 'description' => '4-drawer metal filing cabinet', 'quantity' => 8, 'unit' => 'pieces', 'unit_cost' => 4200.00],
                    ['name' => 'Bookshelf', 'description' => '5-tier wooden bookshelf', 'quantity' => 6, 'unit' => 'pieces', 'unit_cost' => 2800.00],
                    ['name' => 'Conference Table', 'description' => 'Rectangular conference table, seats 8', 'quantity' => 2, 'unit' => 'pieces', 'unit_cost' => 15000.00],
                    ['name' => 'Guest Chair', 'description' => 'Visitor chair with metal frame', 'quantity' => 12, 'unit' => 'pieces', 'unit_cost' => 1200.00],
                ]
            ],
            [
                'name' => 'Medical Supplies',
                'description' => 'Medical and first aid supplies',
                'code' => 'E', // Expendable
                'items' => [
                    ['name' => 'Adhesive Bandages', 'description' => 'Assorted adhesive bandages, 100 pieces per box', 'quantity' => 50, 'unit' => 'boxes', 'unit_cost' => 150.00],
                    ['name' => 'Face Masks', 'description' => 'Surgical face masks, 50 pieces per box', 'quantity' => 100, 'unit' => 'boxes', 'unit_cost' => 200.00],
                    ['name' => 'First Aid Kit', 'description' => 'Complete first aid kit with supplies', 'quantity' => 10, 'unit' => 'kits', 'unit_cost' => 450.00],
                    ['name' => 'Digital Thermometer', 'description' => 'Digital oral thermometer', 'quantity' => 15, 'unit' => 'pieces', 'unit_cost' => 180.00],
                    ['name' => 'Blood Pressure Monitor', 'description' => 'Automatic digital blood pressure monitor', 'quantity' => 8, 'unit' => 'pieces', 'unit_cost' => 1200.00],
                    ['name' => 'Alcohol Swabs', 'description' => 'Sterile alcohol swabs, 100 pieces per box', 'quantity' => 60, 'unit' => 'boxes', 'unit_cost' => 75.00],
                ]
            ],
            [
                'name' => 'Kitchen Supplies',
                'description' => 'Kitchen and pantry supplies',
                'code' => 'E', // Expendable
                'items' => [
                    ['name' => 'Coffee', 'description' => 'Ground coffee, 500g bag', 'quantity' => 20, 'unit' => 'bags', 'unit_cost' => 180.00],
                    ['name' => 'Tea Bags', 'description' => 'Black tea bags, 100 pieces per box', 'quantity' => 30, 'unit' => 'boxes', 'unit_cost' => 120.00],
                    ['name' => 'Sugar', 'description' => 'White sugar, 1kg bag', 'quantity' => 15, 'unit' => 'bags', 'unit_cost' => 45.00],
                    ['name' => 'Paper Cups', 'description' => 'Disposable paper cups, 200ml, 50 pieces per pack', 'quantity' => 40, 'unit' => 'packs', 'unit_cost' => 85.00],
                    ['name' => 'Plastic Plates', 'description' => 'Disposable plastic plates, 25cm, 50 pieces per pack', 'quantity' => 25, 'unit' => 'packs', 'unit_cost' => 150.00],
                ]
            ],
            [
                'name' => 'Safety Equipment',
                'description' => 'Safety and protective equipment',
                'code' => 'SE', // Semi Expendable
                'items' => [
                    ['name' => 'Safety Helmets', 'description' => 'Hard hat safety helmets', 'quantity' => 20, 'unit' => 'pieces', 'unit_cost' => 350.00],
                    ['name' => 'Safety Glasses', 'description' => 'Protective safety glasses', 'quantity' => 30, 'unit' => 'pieces', 'unit_cost' => 120.00],
                    ['name' => 'Fire Extinguisher', 'description' => '5kg ABC dry chemical fire extinguisher', 'quantity' => 5, 'unit' => 'pieces', 'unit_cost' => 850.00],
                    ['name' => 'First Aid Sign', 'description' => 'Wall-mounted first aid kit sign', 'quantity' => 10, 'unit' => 'pieces', 'unit_cost' => 75.00],
                    ['name' => 'Emergency Exit Sign', 'description' => 'LED emergency exit sign', 'quantity' => 8, 'unit' => 'pieces', 'unit_cost' => 450.00],
                ]
            ],
        ];

        // Build mapping to canonical categories (use existing categories only)
        $canonical = [
            'E' => Category::where('code', 'E')->orWhere('name', 'like', '%expendable%')->first(),
            'SE' => Category::where('code', 'SE')->orWhere('name', 'like', '%semi%')->first(),
            'N' => Category::where('code', 'N')->orWhere('name', 'like', '%non%')->first(),
        ];

        foreach ($categories as $categoryData) {
            // Use existing categories only — do NOT create new categories.
            // Prefer lookup by code (E, SE, N) when possible, otherwise try name pattern matching.
            $code = $categoryData['code'] ?? null;

            $category = null;

            if ($code) {
                $category = Category::where('code', $code)->first();
            }

            // Prefer mapping to canonical categories (Expendable / Semi / Non).
            if ($code && !empty($canonical[$code])) {
                $category = $canonical[$code];
            }

            // Fallback: try to match by keywords in the name if canonical mapping failed
            if (!$category) {
                $keyword = strtolower($categoryData['name'] ?? '');
                if (!empty($keyword)) {
                    $category = Category::where('name', 'like', "%{$keyword}%")->first();
                }
            }

            // If still no matching category exists in the DB, warn and skip adding items for it.
            if (!$category) {
                if (method_exists($this, 'command') && $this->command) {
                    $this->command->warn("ItemSeeder: skipping items for '{$categoryData['name']}' — no matching canonical category found (expected Expendable/Semi/Non)");
                }
                continue;
            }

            foreach ($categoryData['items'] as $index => $itemData) {
                $itemNumber = str_pad($index + 1, 3, '0', STR_PAD_LEFT);
                $sku = $categoryData['code'] . $itemNumber;

                Item::updateOrCreate(
                    ['sku' => $sku],
                    array_merge($itemData, [
                        'category_id' => $category->id,
                        'date' => now()->format('Y-m-d'),
                    ])
                );
            }
        }
    }
}
