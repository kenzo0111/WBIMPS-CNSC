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
        Schema::create('property_acknowledgement_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('par_no')->unique();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->date('date')->nullable();
            $table->json('items')->nullable();
            $table->string('received_by_name')->nullable();
            $table->string('received_by_position')->nullable();
            $table->date('received_date')->nullable();
            $table->string('issued_by_name')->nullable();
            $table->string('issued_by_position')->nullable();
            $table->date('issued_date')->nullable();
            $table->string('status')->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_acknowledgement_receipts');
    }
};
