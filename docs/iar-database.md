# Inspection Acceptance Report (IAR) — Database / Migration Guide (moved)

This document has been reorganized into a subfolder for clarity. Please see: `docs/database/iar-database.md`

## Overview

The project includes migrations for the IAR table and related changes. If you're using the repository as-is, the migrations you most likely already have are:

- `2025_10_24_162300_create_inspection_acceptance_reports_table.php` — creates the IAR table
- `2025_11_04_143020_add_missing_fields_to_inspection_acceptance_reports_table.php` — adds extra fields
- `2025_11_04_144120_remove_appendix_title_from_inspection_acceptance_reports_table.php` — removes appendix_title
- `2025_11_05_112059_add_purchase_order_id_to_property_acknowledgement_receipts_and_inspection_acceptance_reports.php` — adds the purchase_order_id foreign key
- `2025_11_23_000000_normalize_iar_items.php` — data migration which normalizes existing JSON `items`

If those migrations are already in your repo (they are), simply run the migrations to create/update the table schema in your current DB.

## Local setup (Windows / XAMPP)

1. Make sure your `.env` is configured with your local DB settings. Example for MySQL on XAMPP:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=supplysystem
DB_USERNAME=root
DB_PASSWORD=
```

2. If the database does not exist yet, create it (from PowerShell or MySQL shell):

PowerShell (MySQL CLI required):

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS supplysystem CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

MySQL shell (no password):

```sql
CREATE DATABASE IF NOT EXISTS supplysystem CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Run the Laravel migrations from the project root:

```powershell
php artisan migrate --force
```

Notes:

- Use `--force` for non-interactive environments (CI). For local development, omit `--force` to be prompted.
- To run a single migration file for testing, use `php artisan migrate --path=database/migrations/2025_10_24_162300_create_inspection_acceptance_reports_table.php` but be careful with dependencies and foreign keys.

## Troubleshooting

- If you get foreign key errors, ensure the referenced table (`purchase_orders`) is migrated first.
- If a migration fails and you need to roll back: `php artisan migrate:rollback`
- If you want to refresh the DB (drop all and re-run): `php artisan migrate:fresh --seed`

If you'd like I can add a small test or seeder to validate an IAR row after migration. ✅
