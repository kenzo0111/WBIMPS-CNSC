<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SyncRolesPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'roles:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync roles and permissions from config/roles_permissions.php to the database';

    public function handle(): int
    {
        $this->info('Reading role & permission mapping from config/roles_permissions.php');

        // Use the existing PermissionSeeder logic to apply the mapping.
        if (class_exists('\Database\Seeders\PermissionSeeder')) {
            $seeder = app()->make('\Database\Seeders\PermissionSeeder');
            $seeder->run();
            $this->info('Roles and permissions synced successfully.');
            return self::SUCCESS;
        }

        $this->error('PermissionSeeder not found. Please ensure \Database\Seeders\PermissionSeeder exists.');
        return self::FAILURE;
    }
}
