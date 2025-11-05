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
        Schema::table('inventory_custodian_slips', function (Blueprint $table) {
            // Received From fields
            $table->string('received_from_name')->nullable()->after('status');
            $table->string('received_from_position')->nullable()->after('received_from_name');
            $table->date('received_from_date')->nullable()->after('received_from_position');

            // Received By fields
            $table->string('received_by_name')->nullable()->after('received_from_date');
            $table->string('received_by_position')->nullable()->after('received_by_name');
            $table->date('received_by_date')->nullable()->after('received_by_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_custodian_slips', function (Blueprint $table) {
            $table->dropColumn([
                'received_from_name',
                'received_from_position',
                'received_from_date',
                'received_by_name',
                'received_by_position',
                'received_by_date',
            ]);
        });
    }
};
