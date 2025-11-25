# Roles & Permissions (moved)

This document has been reorganized into a subfolder for clarity.

Please see the canonical, relocated file at: `docs/reference/roles-permissions.md`

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
