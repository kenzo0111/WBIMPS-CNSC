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
        // Use schema builder to drop the unique index in a DB-agnostic way.
        // Some drivers (SQLite) don't support the "DROP INDEX ... ON table" syntax,
        // so using the schema blueprint ensures compatibility across connections.
        try {
            \Illuminate\Support\Facades\Schema::table('purchase_requests', function (\Illuminate\Database\Schema\Blueprint $table) {
                // dropUnique accepts either an index name or an array of columns
                $table->dropUnique(['request_id']);
            });
        } catch (\Throwable $e) {
            // If the index does not exist or the driver doesn't support the operation,
            // swallow the error to keep migrations idempotent during tests.
            logger()->warning('Could not drop unique index on purchase_requests.request_id: ' . $e->getMessage());
        }
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
