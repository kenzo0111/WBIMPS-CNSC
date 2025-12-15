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
        \Illuminate\Support\Facades\DB::statement('DROP INDEX `purchase_requests_request_id_unique` ON `purchase_requests`');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\Schema::table('purchase_requests', function (\Illuminate\Database\Schema\Blueprint $table) {
            $table->unique('request_id');
        });
    }
};
