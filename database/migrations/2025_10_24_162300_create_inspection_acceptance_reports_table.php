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
            $table->string('invoice_no')->nullable();
            $table->date('invoice_date')->nullable();
            $table->date('date_inspected')->nullable();
            $table->date('date_received')->nullable();
            $table->string('inspection_status')->nullable();
            $table->string('acceptance_status')->nullable();
            $table->json('items')->nullable();
            $table->string('status')->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_acceptance_reports');
    }
};
