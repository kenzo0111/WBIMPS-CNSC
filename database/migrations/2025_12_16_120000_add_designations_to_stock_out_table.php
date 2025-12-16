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
            if (!Schema::hasColumn('stock_out', 'issued_to_designation')) {
                $table->string('issued_to_designation')->nullable()->after('issued_to');
            }
            if (!Schema::hasColumn('stock_out', 'issued_by_designation')) {
                $table->string('issued_by_designation')->nullable()->after('issued_by');
            }
            if (!Schema::hasColumn('stock_out', 'approved_by')) {
                $table->string('approved_by')->nullable()->after('issued_by_designation');
            }
            if (!Schema::hasColumn('stock_out', 'approved_by_designation')) {
                $table->string('approved_by_designation')->nullable()->after('approved_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_out', function (Blueprint $table) {
            if (Schema::hasColumn('stock_out', 'issued_to_designation')) {
                $table->dropColumn('issued_to_designation');
            }
            if (Schema::hasColumn('stock_out', 'issued_by_designation')) {
                $table->dropColumn('issued_by_designation');
            }
            if (Schema::hasColumn('stock_out', 'approved_by')) {
                $table->dropColumn('approved_by');
            }
            if (Schema::hasColumn('stock_out', 'approved_by_designation')) {
                $table->dropColumn('approved_by_designation');
            }
        });
    }
};
