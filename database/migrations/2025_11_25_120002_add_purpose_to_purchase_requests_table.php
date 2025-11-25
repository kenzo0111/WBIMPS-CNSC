<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_requests', 'purpose')) {
                // Use text to allow reasonably long purpose/justifications
                $table->text('purpose')->nullable()->after('items');
            }
        });
    }

    public function down()
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            if (Schema::hasColumn('purchase_requests', 'purpose')) {
                $table->dropColumn('purpose');
            }
        });
    }
};
