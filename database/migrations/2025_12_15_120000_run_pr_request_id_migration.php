<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Execute the migration command; in non-interactive contexts this will run immediately.
        // Use a dry-run toggle via env var PR_MIGRATE_DRY_RUN to preview changes without persisting.
        $dry = env('PR_MIGRATE_DRY_RUN', false) ? '--dry-run' : '';
        try {
            Artisan::call('pr:migrate-ids', [$dry ? '--dry-run' : '--no-interaction' => true]);
        } catch (\Throwable $e) {
            // Fail-safe: log error but allow migrations to continue — user can run command manually.
            logger()->warning('pr:migrate-ids migration command failed: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: this is a data migration that should not be reversed automatically.
    }
};
