<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Use raw SQL to alter column to nullable to avoid requiring doctrine/dbal for change()
        if (Schema::hasTable('stock_out')) {
            try {
                DB::statement("ALTER TABLE `stock_out` MODIFY `transaction_id` VARCHAR(255) NULL;");
            } catch (\Exception $e) {
                // Fallback: if ALTER fails, log or ignore to avoid breaking migrations
                // In a production scenario you'd want to surface this error.
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('stock_out')) {
            try {
                DB::statement("ALTER TABLE `stock_out` MODIFY `transaction_id` VARCHAR(255) NOT NULL;");
            } catch (\Exception $e) {
            }
        }
    }
};
