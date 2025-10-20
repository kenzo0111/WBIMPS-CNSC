# Core Modules of SupplySystem

This document summarizes the core modules (domains) across the SupplySystem codebase and their primary responsibilities, with example files to help you navigate the project.

## Overview

SupplySystem is a Laravel-based inventory / procurement application. The main modules are:

- Authentication / Access
- Admin / Dashboard
- Catalog (Categories & Products)
- Inventory (Stock In / Stock Out)
- Purchase Requests & Purchase Orders
- Document generation (PDFs)

```markdown
# Core Modules — SupplySystem (updated)

This file documents the main modules (domains) in the SupplySystem Laravel app, their responsibilities, key files/paths, and quick navigation tips for maintainers.

Notes about scope and assumptions:

- Based on the repository layout at the workspace root. I assume controllers under `app/Http/Controllers/Api` contain API endpoints and `routes/web.php` contains web + PDF routes.
- Where a filename is referenced but missing in the repo, it's listed because callers or routes still reference it in controllers or docs.

## High level modules

- Authentication & Access
- Admin / Dashboard
- Catalog (Categories & Products)
- Inventory (Stock In / Stock Out)
- Purchase Requests & Purchase Orders
- Document generation (PDF templates and controllers)
- Activity & User Logging
- Mail & Notifications
- Observers, Providers & Model Events
- API surface & Routes

---

## Authentication & Access

Responsibilities

- Login, logout and session handling
- Role checks and admin helpers

Key files

- `app/Http/Controllers/AccessController.php` (auth flows)
- `app/Models/User.php` (roles, helpers such as `isAdmin`)
- `routes/web.php` (web routes that require auth)

---

## Admin / Dashboard

Responsibilities

- Admin dashboard, aggregated metrics and admin-only pages

Key files

- `app/Http/Controllers/Admin/DashboardController.php`
- `resources/views/admin/*`

---

## Catalog (Categories & Products)

Responsibilities

- Manage categories and products, product attributes and relationships

Key files

- `app/Models/Category.php`
- `app/Models/Product.php` — contains computed attributes (for example `total_value`)
- `app/Http/Controllers/Api/CategoryController.php`
- `app/Http/Controllers/Api/ProductController.php`
- `routes/api.php` — API resource routes for categories/products

Notes

- Product quantities and unit costs are used to compute inventory values on save.

---

## Inventory (Stock In / Stock Out)

Responsibilities

- Record stock receipts (stock-in) and stock issuances (stock-out)
- Maintain transaction metadata (supplier, received_by, issued_to, reference numbers)

Key files / tables

- `app/Models/StockIn.php` (table: `stock_in`)
- `app/Models/StockOut.php` (table: `stock_out`)
- `app/Http/Controllers/Api/StockInController.php`
- `app/Http/Controllers/Api/StockOutController.php`
- `routes/api.php` — resource routes for stock-in / stock-out

---

## Purchase Requests & Purchase Orders

Responsibilities

- Submit, review and approve purchase requests (PR)
- Generate purchase orders (PO) from approved PRs
- Store PR items and metadata (commonly JSON-cast fields)

Key files

- `app/Models/PurchaseRequest.php` — JSON-casts for items/metadata
- `app/Http/Controllers/PurchaseRequestController.php` (web)
- `app/Http/Controllers/Api/PurchaseRequestController.php` (API)
- `app/Http/Controllers/PurchaseOrderController.php`

Notes

- PR lifecycle is managed by model events and/or observers; approvals may trigger emails and activity logs.

---

## Document generation (PDFs)

Responsibilities

- Generate printable PDFs for PR, PO and other reports (IAR, ICS, RIS, PAR)

Key files

- PDF generation typically implemented in controllers under `app/Http/Controllers/` (look for `generatePDF`, `preview`, or `download` methods)
- Views / templates: `resources/views/` (search for view names used by PDF controllers)

Tips

- To preview mailables or PDF templates locally, see `scripts/render_mailable.php` and `scripts/test_render_mailable.php`.

---

## Activity & User Logging

Responsibilities

- Record system-level events, user operations, and simple audit trails

Key files

- `app/Models/Activity.php`
- `app/Models/UserLog.php`
- `app/Http/Controllers/Api/ActivityController.php`
- `app/Http/Controllers/Api/UserLogController.php`

---

## Mail & Notifications

Responsibilities

- Send emails for PR submissions, status changes, and other notifications

Key files

- `app/Mail/PurchaseRequestSubmitted.php`
- `app/Mail/StatusChangedMail.php`
- `MAILER_SETUP.md` and `scripts/render_mailable.php`

---

## Suppliers

Responsibilities

- Manage supplier records, addresses and supplier metadata used by stock-in and purchase flows

Key files

- `app/Models/Supplier.php`
- Supplier fields are referenced in PDF templates and stock-in views (search `Supplier` in compiled views under `storage/framework/views`)

Notes

- Suppliers have dedicated model support and are surfaced in PDF templates and stock-in records.

## Observers, Providers & Model Events

Responsibilities

- Hook into model events (create/update/delete) to run side effects (logs, mail, status transitions)

Key files

- `app/Observers/PurchaseRequestObserver.php`
- `app/Providers/AppServiceProvider.php` (bindings and bootstrapping)

---

## Console / Commands

Responsibilities

- CLI helpers, developer tooling and convenience commands (local dev dashboard, renderers)

Key files

- `app/Commands/ServeDashboard.php` — serves the local dashboard used during development
- Misc scripts: `scripts/render_mailable.php`, `scripts/send_test_mail.php`

Notes

- Commands are registered in `app/Console/Kernel.php` and can be executed via `php artisan`.

## API surface & Routes

Responsibilities

- Provide JSON REST endpoints used by any SPA or external integrators

Key files

- `routes/api.php` — primary API routes (categories, products, stock, PRs, activities, user-logs)
- `routes/web.php` — web routes and PDF endpoints

How to explore quickly

- 1. Open `routes/api.php` and `routes/web.php` to see public endpoints.
- 2. Follow route controller references to inspect validation and business logic.
- 3. Inspect models in `app/Models` to find casts and relationships.

---

## Quick maintenance checklist (recommended low-risk improvements)

- Add lightweight per-module docs under `docs/` (examples: `docs/catalog.md`, `docs/inventory.md`).
- Add a `docs/architecture.md` with a simple ERD and flow for PR → PO → StockIn.
- Add tests for the core PR lifecycle: create PR, approve PR (observer side-effects), generate PO, and stock-in adjustments.

---

## Where I can help next

- Generate per-module README files with example requests/responses.
- Create a simple architecture diagram (SVG/PNG) and place it in `docs/diagrams`.
- Add a minimal test suite that exercises the Purchase Request flow (Pest or PHPUnit) and prove it by running the tests.

---

## Recent additions (summary)

- `app/Models/Supplier.php` — supplier model and references in compiled views.
- `app/Commands/ServeDashboard.php` — development CLI to serve a local dashboard.
- Mailables and observer remain central to PR lifecycle (`app/Mail/*`, `app/Observers/PurchaseRequestObserver.php`).

---

If you'd like a specific follow-up, tell me which of the three actions above you want and I'll implement it.
```

---
