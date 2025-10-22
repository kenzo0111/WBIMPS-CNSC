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
        Schema::table('users', function (Blueprint $table) {
            // Only add columns if they do not already exist (prevents duplicate column errors)
            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active');
            }

            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->nullable();
            }

            if (! Schema::hasColumn('users', 'is_admin')) {
                $table->boolean('is_admin')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'role', 'is_admin']);
        });
    }
};
