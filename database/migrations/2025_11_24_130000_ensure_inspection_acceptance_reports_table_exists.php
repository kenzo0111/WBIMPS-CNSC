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
        if (Schema::hasTable('inspection_acceptance_reports')) {
            return; // already exists
        }

        Schema::create('inspection_acceptance_reports', function (Blueprint $table) {
            $table->id();
            $table->string('iar_no')->unique();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->string('supplier')->nullable();
            $table->date('iar_date')->nullable();
            $table->string('po_no')->nullable();
            $table->date('po_date')->nullable();
            $table->string('requisitioning_office')->nullable();
            $table->string('responsibility_center_code')->nullable();
            $table->date('responsibility_date')->nullable();
            $table->string('invoice_no')->nullable();
            $table->date('invoice_date')->nullable();
            $table->date('date_inspected')->nullable();
            $table->date('date_received')->nullable();
            $table->string('inspection_status')->nullable();
            $table->string('inspection_officer_label')->nullable();
            $table->string('acceptance_status')->nullable();
            $table->string('custodian_label')->nullable();
            $table->json('items')->nullable();
            // Avoid hard failure if purchase_orders table doesn't exist yet
            $table->unsignedBigInteger('purchase_order_id')->nullable();
            $table->string('status')->default('Draft');
            $table->timestamps();
        });

        // Add foreign key if referenced table exists
        if (Schema::hasTable('purchase_orders')) {
            Schema::table('inspection_acceptance_reports', function (Blueprint $table) {
                $table->foreign('purchase_order_id')
                    ->references('id')
                    ->on('purchase_orders')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_acceptance_reports');
    }
};
