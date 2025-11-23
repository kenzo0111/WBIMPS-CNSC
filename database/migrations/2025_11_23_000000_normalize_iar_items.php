<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Normalize the items JSON for existing Inspection Acceptance Reports so
        // PDF rendering and other consumers have consistent keys.
        if (!class_exists(\App\Models\InspectionAcceptanceReport::class)) {
            return;
        }

        \App\Models\InspectionAcceptanceReport::chunk(100, function ($reports) {
            foreach ($reports as $r) {
                $items = $r->items;
                if (!is_array($items) || empty($items)) {
                    continue;
                }

                $normalized = [];
                foreach ($items as $item) {
                    $stock = $item['stock_no'] ?? $item['stock_number'] ?? $item['item_no'] ?? '';
                    $description = $item['description'] ?? $item['detailedDescription'] ?? $item['detailed_description'] ?? '';
                    $unit = $item['unit'] ?? $item['unitOfMeasure'] ?? $item['unit_of_measure'] ?? '';
                    $quantity = $item['quantity'] ?? $item['qty'] ?? $item['requested_quantity'] ?? $item['requestedQuantity'] ?? '';

                    $normalized[] = [
                        'stock_no' => $stock,
                        'description' => $description,
                        'unit' => $unit,
                        'quantity' => $quantity,
                    ];
                }

                $r->items = $normalized;
                $r->saveQuietly();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No safe reversal for this data migration - leave as-is.
    }
};
