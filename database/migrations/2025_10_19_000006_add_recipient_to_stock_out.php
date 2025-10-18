<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('stock_out') && !Schema::hasColumn('stock_out', 'recipient')) {
            Schema::table('stock_out', function (Blueprint $table) {
                $table->string('recipient')->nullable()->after('quantity');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('stock_out') && Schema::hasColumn('stock_out', 'recipient')) {
            Schema::table('stock_out', function (Blueprint $table) {
                $table->dropColumn('recipient');
            });
        }
    }
};
