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
        Schema::table('inspection_acceptance_reports', function (Blueprint $table) {
            $table->string('inspection_officer_position')->nullable()->after('inspection_officer_label');
            $table->string('custodian_position')->nullable()->after('custodian_label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_acceptance_reports', function (Blueprint $table) {
            $table->dropColumn(['inspection_officer_position', 'custodian_position']);
        });
    }
};
