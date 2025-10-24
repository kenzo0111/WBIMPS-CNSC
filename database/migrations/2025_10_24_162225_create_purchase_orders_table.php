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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->string('supplier')->nullable();
            $table->text('supplier_address')->nullable();
            $table->date('date_of_purchase')->nullable();
            $table->string('tin_number')->nullable();
            $table->string('mode_of_procurement')->nullable();
            $table->string('place_of_delivery')->nullable();
            $table->string('delivery_term')->nullable();
            $table->date('date_of_delivery')->nullable();
            $table->string('payment_term')->nullable();
            $table->json('items')->nullable();
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('fund_cluster')->nullable();
            $table->string('ors_burs_no')->nullable();
            $table->string('funds_available')->nullable();
            $table->date('ors_burs_date')->nullable();
            $table->decimal('ors_burs_amount', 15, 2)->nullable();
            $table->string('accountant_signature')->nullable();
            $table->string('entity_name')->nullable();
            $table->text('entity_address')->nullable();
            $table->string('status')->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
