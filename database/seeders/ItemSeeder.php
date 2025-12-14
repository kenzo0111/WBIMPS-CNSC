<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::all()->keyBy('code');

        $items = [
            'E' => [
                ['name' => 'Bond Paper', 'description' => 'Standard bond paper for printing', 'unit' => 'ream', 'unit_cost' => 150.00, 'quantity' => 10],
                ['name' => 'Ballpen', 'description' => 'Blue ballpoint pen', 'unit' => 'piece', 'unit_cost' => 5.00, 'quantity' => 50],
                ['name' => 'Ink Cartridge', 'description' => 'Black ink cartridge for printer', 'unit' => 'piece', 'unit_cost' => 200.00, 'quantity' => 5],
                ['name' => 'Cleaning Supplies', 'description' => 'General cleaning materials', 'unit' => 'set', 'unit_cost' => 100.00, 'quantity' => 20],
                ['name' => 'Folders', 'description' => 'Plastic folders for documents', 'unit' => 'piece', 'unit_cost' => 10.00, 'quantity' => 100],
                ['name' => 'Whiteboard Markers', 'description' => 'Dry erase markers for whiteboard', 'unit' => 'pack', 'unit_cost' => 25.00, 'quantity' => 15],
                ['name' => 'Notebooks', 'description' => 'Spiral notebooks for notes', 'unit' => 'piece', 'unit_cost' => 20.00, 'quantity' => 40],
                ['name' => 'Envelopes', 'description' => 'Standard business envelopes', 'unit' => 'pack', 'unit_cost' => 15.00, 'quantity' => 25],
                ['name' => 'Tape', 'description' => 'Transparent adhesive tape', 'unit' => 'roll', 'unit_cost' => 12.00, 'quantity' => 30],
                ['name' => 'Staple Wires', 'description' => 'Staple wires for stapler', 'unit' => 'box', 'unit_cost' => 8.00, 'quantity' => 50],
                ['name' => 'Highlighters', 'description' => 'Fluorescent highlighters', 'unit' => 'pack', 'unit_cost' => 18.00, 'quantity' => 20],
                ['name' => 'Correction Tape', 'description' => 'White correction tape', 'unit' => 'piece', 'unit_cost' => 22.00, 'quantity' => 25],
                ['name' => 'Glue Sticks', 'description' => 'Washable glue sticks', 'unit' => 'pack', 'unit_cost' => 14.00, 'quantity' => 35],
                ['name' => 'Ruler', 'description' => 'Plastic ruler 12 inches', 'unit' => 'piece', 'unit_cost' => 6.00, 'quantity' => 60],
                ['name' => 'Calculator', 'description' => 'Basic calculator', 'unit' => 'piece', 'unit_cost' => 45.00, 'quantity' => 12],
                ['name' => 'Whiteboard Eraser', 'description' => 'Magnetic whiteboard eraser', 'unit' => 'piece', 'unit_cost' => 28.00, 'quantity' => 18],
                ['name' => 'Push Pins', 'description' => 'Colored push pins', 'unit' => 'pack', 'unit_cost' => 5.00, 'quantity' => 80],
                ['name' => 'Paper Clips', 'description' => 'Standard paper clips', 'unit' => 'box', 'unit_cost' => 3.00, 'quantity' => 100],
                ['name' => 'Rubber Bands', 'description' => 'Assorted rubber bands', 'unit' => 'pack', 'unit_cost' => 7.00, 'quantity' => 45],
                ['name' => 'Index Cards', 'description' => 'Blank index cards', 'unit' => 'pack', 'unit_cost' => 11.00, 'quantity' => 30],
                ['name' => 'Permanent Markers', 'description' => 'Black permanent markers', 'unit' => 'pack', 'unit_cost' => 16.00, 'quantity' => 22],
                ['name' => 'Post-it Notes', 'description' => 'Yellow sticky notes', 'unit' => 'pack', 'unit_cost' => 9.00, 'quantity' => 40],
                ['name' => 'Clipboards', 'description' => 'Plastic clipboards', 'unit' => 'piece', 'unit_cost' => 13.00, 'quantity' => 28],
                ['name' => 'File Dividers', 'description' => 'Tab file dividers', 'unit' => 'set', 'unit_cost' => 19.00, 'quantity' => 20],
                ['name' => 'Binding Covers', 'description' => 'Clear binding covers', 'unit' => 'pack', 'unit_cost' => 24.00, 'quantity' => 16],
                ['name' => 'Label Stickers', 'description' => 'Address label stickers', 'unit' => 'pack', 'unit_cost' => 8.00, 'quantity' => 35],
                ['name' => 'Drawing Pencils', 'description' => 'HB drawing pencils', 'unit' => 'pack', 'unit_cost' => 4.00, 'quantity' => 75],
                ['name' => 'Erasers', 'description' => 'Pink erasers', 'unit' => 'pack', 'unit_cost' => 2.00, 'quantity' => 90],
                ['name' => 'Sharpeners', 'description' => 'Manual pencil sharpeners', 'unit' => 'piece', 'unit_cost' => 3.00, 'quantity' => 55],
                ['name' => 'Color Pencils', 'description' => '12-color pencil set', 'unit' => 'set', 'unit_cost' => 32.00, 'quantity' => 14],
                ['name' => 'Sketch Pads', 'description' => 'A4 sketch pads', 'unit' => 'piece', 'unit_cost' => 17.00, 'quantity' => 25],
                ['name' => 'Art Brushes', 'description' => 'Assorted art brushes', 'unit' => 'set', 'unit_cost' => 26.00, 'quantity' => 19],
                ['name' => 'Crayons', 'description' => '24-color crayon box', 'unit' => 'box', 'unit_cost' => 21.00, 'quantity' => 23],
                ['name' => 'Watercolor Paints', 'description' => '8-color watercolor set', 'unit' => 'set', 'unit_cost' => 38.00, 'quantity' => 11],
                ['name' => 'Canvas Boards', 'description' => 'Pre-stretched canvas boards', 'unit' => 'piece', 'unit_cost' => 29.00, 'quantity' => 17],
            ],
            'SL' => [
                ['name' => 'Stapler', 'description' => 'Standard office stapler', 'unit' => 'piece', 'unit_cost' => 50.00, 'quantity' => 10],
                ['name' => 'Scissors', 'description' => 'Office scissors', 'unit' => 'piece', 'unit_cost' => 30.00, 'quantity' => 15],
                ['name' => 'Computer Mouse', 'description' => 'Wired computer mouse', 'unit' => 'piece', 'unit_cost' => 150.00, 'quantity' => 20],
                ['name' => 'Keyboard', 'description' => 'Standard computer keyboard', 'unit' => 'piece', 'unit_cost' => 300.00, 'quantity' => 10],
                ['name' => 'Extension Cord', 'description' => '5-meter extension cord', 'unit' => 'piece', 'unit_cost' => 80.00, 'quantity' => 25],
                ['name' => 'Wastebasket', 'description' => 'Plastic wastebasket', 'unit' => 'piece', 'unit_cost' => 40.00, 'quantity' => 30],
                ['name' => 'Desk Organizer', 'description' => 'Multi-compartment desk organizer', 'unit' => 'piece', 'unit_cost' => 65.00, 'quantity' => 12],
                ['name' => 'Wall Clock', 'description' => 'Round wall clock', 'unit' => 'piece', 'unit_cost' => 85.00, 'quantity' => 8],
                ['name' => 'Bulletin Board', 'description' => 'Cork bulletin board', 'unit' => 'piece', 'unit_cost' => 120.00, 'quantity' => 6],
                ['name' => 'Whiteboard', 'description' => 'Magnetic whiteboard', 'unit' => 'piece', 'unit_cost' => 180.00, 'quantity' => 4],
                ['name' => 'Filing Cabinet', 'description' => '2-drawer filing cabinet', 'unit' => 'piece', 'unit_cost' => 250.00, 'quantity' => 3],
                ['name' => 'Bookshelf', 'description' => 'Small bookshelf', 'unit' => 'piece', 'unit_cost' => 220.00, 'quantity' => 5],
                ['name' => 'Coat Rack', 'description' => 'Wall-mounted coat rack', 'unit' => 'piece', 'unit_cost' => 95.00, 'quantity' => 9],
                ['name' => 'Floor Mat', 'description' => 'Anti-fatigue floor mat', 'unit' => 'piece', 'unit_cost' => 75.00, 'quantity' => 14],
                ['name' => 'Door Stopper', 'description' => 'Magnetic door stopper', 'unit' => 'piece', 'unit_cost' => 35.00, 'quantity' => 20],
                ['name' => 'Key Holder', 'description' => 'Wall key holder', 'unit' => 'piece', 'unit_cost' => 45.00, 'quantity' => 16],
                ['name' => 'Letter Tray', 'description' => 'Plastic letter tray', 'unit' => 'piece', 'unit_cost' => 25.00, 'quantity' => 24],
                ['name' => 'Document Holder', 'description' => 'Adjustable document holder', 'unit' => 'piece', 'unit_cost' => 55.00, 'quantity' => 13],
                ['name' => 'Cable Organizer', 'description' => 'Cable management organizer', 'unit' => 'piece', 'unit_cost' => 40.00, 'quantity' => 18],
                ['name' => 'Screen Cleaner', 'description' => 'LCD screen cleaning kit', 'unit' => 'kit', 'unit_cost' => 60.00, 'quantity' => 15],
                ['name' => 'USB Hub', 'description' => '4-port USB hub', 'unit' => 'piece', 'unit_cost' => 90.00, 'quantity' => 10],
                ['name' => 'External Hard Drive', 'description' => '1TB external hard drive', 'unit' => 'piece', 'unit_cost' => 280.00, 'quantity' => 7],
                ['name' => 'Webcam', 'description' => 'HD webcam', 'unit' => 'piece', 'unit_cost' => 160.00, 'quantity' => 8],
                ['name' => 'Headphones', 'description' => 'Wired headphones', 'unit' => 'piece', 'unit_cost' => 120.00, 'quantity' => 12],
                ['name' => 'Speakers', 'description' => 'Computer speakers', 'unit' => 'pair', 'unit_cost' => 140.00, 'quantity' => 9],
                ['name' => 'Flash Drive', 'description' => '32GB USB flash drive', 'unit' => 'piece', 'unit_cost' => 85.00, 'quantity' => 15],
                ['name' => 'Mouse Pad', 'description' => 'Ergonomic mouse pad', 'unit' => 'piece', 'unit_cost' => 20.00, 'quantity' => 25],
                ['name' => 'Wrist Rest', 'description' => 'Keyboard wrist rest', 'unit' => 'piece', 'unit_cost' => 35.00, 'quantity' => 20],
                ['name' => 'Lamp', 'description' => 'Desk lamp', 'unit' => 'piece', 'unit_cost' => 110.00, 'quantity' => 11],
                ['name' => 'Fan', 'description' => 'USB desk fan', 'unit' => 'piece', 'unit_cost' => 70.00, 'quantity' => 16],
                ['name' => 'Calculator Stand', 'description' => 'Desktop calculator stand', 'unit' => 'piece', 'unit_cost' => 45.00, 'quantity' => 17],
                ['name' => 'Business Card Holder', 'description' => 'Acrylic business card holder', 'unit' => 'piece', 'unit_cost' => 30.00, 'quantity' => 22],
                ['name' => 'Name Plate', 'description' => 'Desk name plate', 'unit' => 'piece', 'unit_cost' => 50.00, 'quantity' => 18],
                ['name' => 'Pen Holder', 'description' => 'Ceramic pen holder', 'unit' => 'piece', 'unit_cost' => 40.00, 'quantity' => 19],
                ['name' => 'Bookmark Holder', 'description' => 'Magnetic bookmark holder', 'unit' => 'piece', 'unit_cost' => 25.00, 'quantity' => 23],
                ['name' => 'Clip Holder', 'description' => 'Desktop clip dispenser', 'unit' => 'piece', 'unit_cost' => 55.00, 'quantity' => 14],
            ],
            'SH' => [
                ['name' => 'Office Chair', 'description' => 'Ergonomic office chair', 'unit' => 'piece', 'unit_cost' => 2500.00, 'quantity' => 5],
                ['name' => 'Mid-range Printer', 'description' => 'Laser printer for office use', 'unit' => 'piece', 'unit_cost' => 8000.00, 'quantity' => 2],
                ['name' => 'Projector', 'description' => 'LCD projector', 'unit' => 'piece', 'unit_cost' => 15000.00, 'quantity' => 1],
                ['name' => 'Copier Machine', 'description' => 'Small office copier', 'unit' => 'piece', 'unit_cost' => 12000.00, 'quantity' => 1],
                ['name' => 'Scanner', 'description' => 'Flatbed scanner', 'unit' => 'piece', 'unit_cost' => 4500.00, 'quantity' => 3],
                ['name' => 'Fax Machine', 'description' => 'Analog fax machine', 'unit' => 'piece', 'unit_cost' => 3500.00, 'quantity' => 2],
                ['name' => 'Shredder', 'description' => 'Paper shredder', 'unit' => 'piece', 'unit_cost' => 2800.00, 'quantity' => 4],
                ['name' => 'Binding Machine', 'description' => 'Thermal binding machine', 'unit' => 'piece', 'unit_cost' => 3200.00, 'quantity' => 3],
                ['name' => 'Laminator', 'description' => 'Pouch laminator', 'unit' => 'piece', 'unit_cost' => 2900.00, 'quantity' => 3],
                ['name' => 'Water Dispenser', 'description' => 'Hot and cold water dispenser', 'unit' => 'piece', 'unit_cost' => 4200.00, 'quantity' => 2],
                ['name' => 'Refrigerator', 'description' => 'Mini office refrigerator', 'unit' => 'piece', 'unit_cost' => 3800.00, 'quantity' => 2],
                ['name' => 'Microwave Oven', 'description' => 'Countertop microwave', 'unit' => 'piece', 'unit_cost' => 3600.00, 'quantity' => 3],
                ['name' => 'Coffee Maker', 'description' => 'Drip coffee maker', 'unit' => 'piece', 'unit_cost' => 2400.00, 'quantity' => 4],
                ['name' => 'Electric Kettle', 'description' => 'Electric water kettle', 'unit' => 'piece', 'unit_cost' => 1800.00, 'quantity' => 5],
                ['name' => 'Toaster', 'description' => '2-slice toaster', 'unit' => 'piece', 'unit_cost' => 1600.00, 'quantity' => 6],
                ['name' => 'Blender', 'description' => 'Countertop blender', 'unit' => 'piece', 'unit_cost' => 2200.00, 'quantity' => 4],
                ['name' => 'Standing Fan', 'description' => '16-inch standing fan', 'unit' => 'piece', 'unit_cost' => 1900.00, 'quantity' => 5],
                ['name' => 'Heater', 'description' => 'Electric space heater', 'unit' => 'piece', 'unit_cost' => 2100.00, 'quantity' => 4],
                ['name' => 'Humidifier', 'description' => 'Ultrasonic humidifier', 'unit' => 'piece', 'unit_cost' => 2600.00, 'quantity' => 3],
                ['name' => 'Air Purifier', 'description' => 'HEPA air purifier', 'unit' => 'piece', 'unit_cost' => 4800.00, 'quantity' => 2],
                ['name' => 'Dehumidifier', 'description' => 'Portable dehumidifier', 'unit' => 'piece', 'unit_cost' => 3400.00, 'quantity' => 3],
                ['name' => 'Safe Box', 'description' => 'Fire-resistant safe box', 'unit' => 'piece', 'unit_cost' => 4100.00, 'quantity' => 2],
            ],
            'N' => [
                ['name' => 'Desktop Computer', 'description' => 'Office desktop computer', 'unit' => 'unit', 'unit_cost' => 60000.00, 'quantity' => 3],
                ['name' => 'Laptop', 'description' => 'Business laptop', 'unit' => 'unit', 'unit_cost' => 55000.00, 'quantity' => 4],
                ['name' => 'Air Conditioning Unit', 'description' => 'Split-type air conditioner', 'unit' => 'unit', 'unit_cost' => 75000.00, 'quantity' => 2],
                ['name' => 'Vehicle', 'description' => 'Service vehicle', 'unit' => 'unit', 'unit_cost' => 500000.00, 'quantity' => 1],
                ['name' => 'Generator', 'description' => 'Backup power generator', 'unit' => 'unit', 'unit_cost' => 100000.00, 'quantity' => 1],
                ['name' => 'Heavy Machinery', 'description' => 'Industrial equipment', 'unit' => 'unit', 'unit_cost' => 200000.00, 'quantity' => 1],
                ['name' => 'Server Rack', 'description' => 'Network server rack', 'unit' => 'unit', 'unit_cost' => 85000.00, 'quantity' => 1],
                ['name' => 'UPS System', 'description' => 'Uninterruptible power supply', 'unit' => 'unit', 'unit_cost' => 65000.00, 'quantity' => 2],
                ['name' => 'Network Switch', 'description' => '24-port managed switch', 'unit' => 'unit', 'unit_cost' => 55000.00, 'quantity' => 3],
                ['name' => 'Router', 'description' => 'Enterprise router', 'unit' => 'unit', 'unit_cost' => 70000.00, 'quantity' => 2],
                ['name' => 'Firewall Appliance', 'description' => 'Network security firewall', 'unit' => 'unit', 'unit_cost' => 90000.00, 'quantity' => 1],
                ['name' => 'Storage Server', 'description' => 'NAS storage server', 'unit' => 'unit', 'unit_cost' => 120000.00, 'quantity' => 1],
                ['name' => 'Workstation', 'description' => 'High-end workstation', 'unit' => 'unit', 'unit_cost' => 150000.00, 'quantity' => 2],
                ['name' => 'Plotter', 'description' => 'Large format plotter', 'unit' => 'unit', 'unit_cost' => 80000.00, 'quantity' => 1],
                ['name' => '3D Printer', 'description' => 'Professional 3D printer', 'unit' => 'unit', 'unit_cost' => 95000.00, 'quantity' => 1],
                ['name' => 'CNC Machine', 'description' => 'Computer numerical control machine', 'unit' => 'unit', 'unit_cost' => 250000.00, 'quantity' => 1],
                ['name' => 'Forklift', 'description' => 'Electric forklift', 'unit' => 'unit', 'unit_cost' => 300000.00, 'quantity' => 1],
                ['name' => 'Crane', 'description' => 'Overhead crane', 'unit' => 'unit', 'unit_cost' => 400000.00, 'quantity' => 1],
                ['name' => 'Conveyor System', 'description' => 'Automated conveyor system', 'unit' => 'unit', 'unit_cost' => 180000.00, 'quantity' => 1],
                ['name' => 'Packaging Machine', 'description' => 'Automated packaging machine', 'unit' => 'unit', 'unit_cost' => 160000.00, 'quantity' => 1],
                ['name' => 'Welding Machine', 'description' => 'Industrial welding machine', 'unit' => 'unit', 'unit_cost' => 140000.00, 'quantity' => 1],
                ['name' => 'Press Machine', 'description' => 'Hydraulic press machine', 'unit' => 'unit', 'unit_cost' => 220000.00, 'quantity' => 1],
                ['name' => 'Lathe Machine', 'description' => 'CNC lathe machine', 'unit' => 'unit', 'unit_cost' => 280000.00, 'quantity' => 1],
                ['name' => 'Milling Machine', 'description' => 'CNC milling machine', 'unit' => 'unit', 'unit_cost' => 350000.00, 'quantity' => 1],
                ['name' => 'Drill Press', 'description' => 'Heavy-duty drill press', 'unit' => 'unit', 'unit_cost' => 110000.00, 'quantity' => 1],
                ['name' => 'Grinding Machine', 'description' => 'Surface grinding machine', 'unit' => 'unit', 'unit_cost' => 130000.00, 'quantity' => 1],
            ],
        ];

        $skuCounters = [];

        foreach ($items as $categoryCode => $categoryItems) {
            if (!isset($categories[$categoryCode])) {
                continue;
            }

            $category = $categories[$categoryCode];
            $counter = $skuCounters[$categoryCode] ?? 1;

            foreach ($categoryItems as $itemData) {
                $sku = $categoryCode . '-' . str_pad($counter, 3, '0', STR_PAD_LEFT);

                Item::updateOrCreate(
                    ['sku' => $sku],
                    array_merge($itemData, [
                        'category_id' => $category->id,
                        'total_value' => $itemData['unit_cost'] * $itemData['quantity'],
                        'date' => now()->toDateString(),
                    ])
                );

                $counter++;
            }

            $skuCounters[$categoryCode] = $counter;
        }
    }
}