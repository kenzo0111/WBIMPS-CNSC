<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('code', 10)->nullable()->unique()->after('id');
        });

        // Backfill existing categories with C001, C002 ... ordering by id
        $cats = DB::table('categories')->orderBy('id')->get();
        $i = 1;
        foreach ($cats as $cat) {
            $code = sprintf('C%03d', $i);
            DB::table('categories')->where('id', $cat->id)->update(['code' => $code]);
            $i++;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }
};
