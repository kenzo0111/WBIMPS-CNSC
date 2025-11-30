<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // If the old activities table exists, convert it to Spatie's activity_log format.
        if (Schema::hasTable('activities')) {
            Schema::rename('activities', 'activity_log');

            // Rename and add columns to match Spatie table columns used by the package.
            Schema::table('activity_log', function (Blueprint $table) {
                // Rename action -> description
                if (Schema::hasColumn('activity_log', 'action')) {
                    $table->renameColumn('action', 'description');
                }

                // Rename meta -> properties
                if (Schema::hasColumn('activity_log', 'meta')) {
                    $table->renameColumn('meta', 'properties');
                }

                // Rename actor_type -> causer_type and actor_id -> causer_id
                if (Schema::hasColumn('activity_log', 'actor_type')) {
                    $table->renameColumn('actor_type', 'causer_type');
                }
                if (Schema::hasColumn('activity_log', 'actor_id')) {
                    $table->renameColumn('actor_id', 'causer_id');
                }

                // Add additional Spatie columns if not present
                if (!Schema::hasColumn('activity_log', 'log_name')) {
                    $table->string('log_name')->nullable()->after('id');
                }
                if (!Schema::hasColumn('activity_log', 'subject_type')) {
                    $table->string('subject_type')->nullable()->after('properties');
                }
                if (!Schema::hasColumn('activity_log', 'subject_id')) {
                    $table->unsignedBigInteger('subject_id')->nullable()->after('subject_type');
                }

                // Ensure properties column is JSON (it was json previously, but rename preserves the type if done by DB platform)
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('activity_log')) {
            Schema::table('activity_log', function (Blueprint $table) {
                if (Schema::hasColumn('activity_log', 'description')) {
                    $table->renameColumn('description', 'action');
                }
                if (Schema::hasColumn('activity_log', 'properties')) {
                    $table->renameColumn('properties', 'meta');
                }
                if (Schema::hasColumn('activity_log', 'causer_type')) {
                    $table->renameColumn('causer_type', 'actor_type');
                }
                if (Schema::hasColumn('activity_log', 'causer_id')) {
                    $table->renameColumn('causer_id', 'actor_id');
                }
                if (Schema::hasColumn('activity_log', 'subject_type')) {
                    $table->dropColumn('subject_type');
                }
                if (Schema::hasColumn('activity_log', 'subject_id')) {
                    $table->dropColumn('subject_id');
                }
                if (Schema::hasColumn('activity_log', 'log_name')) {
                    $table->dropColumn('log_name');
                }
            });

            Schema::rename('activity_log', 'activities');
        }
    }
};
