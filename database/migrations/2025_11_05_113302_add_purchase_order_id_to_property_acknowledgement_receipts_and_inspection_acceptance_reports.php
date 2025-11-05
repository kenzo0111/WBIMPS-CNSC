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
        // Add purchase_order_id to property_acknowledgement_receipts table
        Schema::table('property_acknowledgement_receipts', function (Blueprint $table) {
            $table->unsignedBigInteger('purchase_order_id')->nullable()->after('id');
            $table->foreign('purchase_order_id')
                ->references('id')
                ->on('purchase_orders')
                ->onDelete('cascade');
        });

        // Add purchase_order_id to inspection_acceptance_reports table
        Schema::table('inspection_acceptance_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('purchase_order_id')->nullable()->after('id');
            $table->foreign('purchase_order_id')
                ->references('id')
                ->on('purchase_orders')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove foreign key and column from property_acknowledgement_receipts
        Schema::table('property_acknowledgement_receipts', function (Blueprint $table) {
            $table->dropForeign(['purchase_order_id']);
            $table->dropColumn('purchase_order_id');
        });

        // Remove foreign key and column from inspection_acceptance_reports
        Schema::table('inspection_acceptance_reports', function (Blueprint $table) {
            $table->dropForeign(['purchase_order_id']);
            $table->dropColumn('purchase_order_id');
        });
    }
};
