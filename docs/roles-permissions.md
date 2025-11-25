# Roles & Permissions (canonical)

This document lists the application's canonical roles and the permissions assigned to each role. The authoritative source for this mapping is `config/roles_permissions.php` and the `php artisan roles:sync` command can be used to enforce this mapping in the database.

> Note: If you update permissions or roles here, also update `config/roles_permissions.php` (the config file is the single source of truth for seeding/syncing).

---

## System Admin

- manage everything
- manage categories
- manage items
- manage supplies
- manage stock in
- manage stock out
- create requests
- manage requests
- view reports

## Administrator

- manage categories
- manage items
- manage supplies
- manage requests
- view reports

## Supply Officer

- manage items
- manage supplies
- create requests
- manage requests

## Office Assistant

- create requests
- view reports

## Student Assistant

- create requests
- manage stock in
- manage stock out

---

## How to sync the mapping into the DB

Run the central sync command (recommended in deployment/CI):

```bash
php artisan roles:sync
```

This ensures the database reflects the canonical `config/roles_permissions.php` mapping.
