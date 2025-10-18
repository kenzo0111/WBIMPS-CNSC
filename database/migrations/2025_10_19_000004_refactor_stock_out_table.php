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
        Schema::table('stock_out', function (Blueprint $table) {
            // New fields to match UI table header
            if (!Schema::hasColumn('stock_out', 'issue_id')) {
                $table->string('issue_id')->unique()->nullable()->after('transaction_id');
            }
            if (!Schema::hasColumn('stock_out', 'unit_cost')) {
                $table->decimal('unit_cost', 10, 2)->default(0)->after('quantity');
            }
            if (!Schema::hasColumn('stock_out', 'total_cost')) {
                $table->decimal('total_cost', 12, 2)->default(0)->after('unit_cost');
            }
            if (!Schema::hasColumn('stock_out', 'department')) {
                $table->string('department')->nullable()->after('total_cost');
            }
            if (!Schema::hasColumn('stock_out', 'issued_to')) {
                $table->string('issued_to')->nullable()->after('department');
            }
            if (!Schema::hasColumn('stock_out', 'issued_by')) {
                $table->string('issued_by')->nullable()->after('issued_to');
            }
            if (!Schema::hasColumn('stock_out', 'status')) {
                $table->string('status')->nullable()->after('issued_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_out', function (Blueprint $table) {
            if (Schema::hasColumn('stock_out', 'issue_id')) {
                $table->dropColumn('issue_id');
            }
            if (Schema::hasColumn('stock_out', 'unit_cost')) {
                $table->dropColumn('unit_cost');
            }
            if (Schema::hasColumn('stock_out', 'total_cost')) {
                $table->dropColumn('total_cost');
            }
            if (Schema::hasColumn('stock_out', 'department')) {
                $table->dropColumn('department');
            }
            if (Schema::hasColumn('stock_out', 'issued_to')) {
                $table->dropColumn('issued_to');
            }
            if (Schema::hasColumn('stock_out', 'issued_by')) {
                $table->dropColumn('issued_by');
            }
            if (Schema::hasColumn('stock_out', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
