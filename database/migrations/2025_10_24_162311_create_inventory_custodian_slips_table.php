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
        Schema::create('inventory_custodian_slips', function (Blueprint $table) {
            $table->id();
            $table->string('ics_no')->unique();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->json('items')->nullable();
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('status')->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_custodian_slips');
    }
};
