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
            if (!Schema::hasColumn('stock_out', 'fund_cluster')) {
                $table->string('fund_cluster')->nullable()->after('issued_by');
            }
            if (!Schema::hasColumn('stock_out', 'responsibility_center_code')) {
                $table->string('responsibility_center_code')->nullable()->after('fund_cluster');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_out', function (Blueprint $table) {
            if (Schema::hasColumn('stock_out', 'fund_cluster')) {
                $table->dropColumn('fund_cluster');
            }
            if (Schema::hasColumn('stock_out', 'responsibility_center_code')) {
                $table->dropColumn('responsibility_center_code');
            }
        });
    }
};
