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
        Schema::table('requisition_issue_slips', function (Blueprint $table) {
            $table->boolean('stock_available')->default(false)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requisition_issue_slips', function (Blueprint $table) {
            $table->dropColumn('stock_available');
        });
    }
};
