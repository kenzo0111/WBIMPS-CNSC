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
        Schema::table('inspection_acceptance_reports', function (Blueprint $table) {
            $table->string('appendix_title')->nullable()->after('iar_no');
            $table->date('responsibility_date')->nullable()->after('responsibility_center_code');
            $table->string('inspection_officer_label')->nullable()->after('inspection_status');
            $table->string('custodian_label')->nullable()->after('acceptance_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_acceptance_reports', function (Blueprint $table) {
            $table->dropColumn(['appendix_title', 'responsibility_date', 'inspection_officer_label', 'custodian_label']);
        });
    }
};
