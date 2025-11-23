<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Best-effort backfill: associate existing IAR records with Purchase Order
        // by matching the `po_no` on IAR to `po_number` on purchase_orders.
        if (!Schema::hasTable('inspection_acceptance_reports') || !Schema::hasTable('purchase_orders')) {
            return;
        }

        // For safety run as a raw update where matching po numbers exist
        $rows = DB::table('inspection_acceptance_reports')
            ->whereNull('purchase_order_id')
            ->whereNotNull('po_no')
            ->get(['id', 'po_no']);

        foreach ($rows as $r) {
            try {
                $po = DB::table('purchase_orders')->where('po_number', $r->po_no)->first(['id']);
                if ($po) {
                    DB::table('inspection_acceptance_reports')->where('id', $r->id)->update(['purchase_order_id' => $po->id]);
                }
            } catch (\Throwable $e) {
                // swallow any errors in test/deploy environments
                continue;
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback required for backfill
    }
};
