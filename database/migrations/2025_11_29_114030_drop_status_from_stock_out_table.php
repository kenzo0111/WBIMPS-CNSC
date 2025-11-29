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
        Schema::table('stock_out', function (Blueprint $table) {
            if (Schema::hasColumn('stock_out', 'status')) {
                $table->dropColumn('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_out', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_out', 'status')) {
                $table->string('status')->nullable()->after('issued_by');
            }
        });
    }
};
