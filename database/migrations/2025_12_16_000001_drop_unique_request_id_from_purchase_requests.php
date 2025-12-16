<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            // Remove unique constraint to allow multiple rows to share a request_id (batch requests)
            if (Schema::hasColumn('purchase_requests', 'request_id')) {
                try {
                    // Only attempt to drop the unique index if it exists.
                    $exists = false;
                    try {
                        $rows = \Illuminate\Support\Facades\DB::select("SHOW INDEX FROM `purchase_requests` WHERE Column_name = ?", ['request_id']);
                        foreach ($rows as $r) {
                            // MySQL "Non_unique" is 0 for unique indexes
                            if (isset($r->Non_unique) && intval($r->Non_unique) === 0) {
                                $exists = true;
                                break;
                            }
                        }
                    } catch (\Exception $inner) {
                        // If SHOW INDEX fails for any reason (e.g., SQLite in tests), do not attempt the drop
                        $exists = false;
                    }

                    if ($exists) {
                        $table->dropUnique('purchase_requests_request_id_unique');
                    }
                } catch (\Exception $e) {
                    // If the index doesn't exist or the driver doesn't support it, ignore
                }
            }
        });
    }

    public function down()
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            // restore unique index (cautious: may fail if duplicates exist)
            try {
                $table->unique('request_id');
            } catch (\Exception $e) {
                // ignore — can't re-create unique index if duplicates were created
            }
        });
    }
};