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
        Schema::table('products', function (Blueprint $table) {
            // Only add if missing to be safe
            if (!Schema::hasColumn('products', 'category_id')) {
                $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null')->after('description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'category_id')) {
                // drop foreign and column
                try {
                    $table->dropForeign(['category_id']);
                } catch (\Throwable $e) {
                }
                $table->dropColumn('category_id');
            }
        });
    }
};
