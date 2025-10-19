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
- Activity & User Logging
- Mail & Notifications
- Observers & Providers
- API & Routes

Each module section below lists responsibilities and key files to inspect.

---

## Authentication / Access

Responsibilities:

- User authentication and session management
- Role and admin checks

Key files:

- `app/Http/Controllers/AccessController.php` — login/logout and auth flows
- `app/Models/User.php` — user model, roles, isAdmin helper
- `routes/web.php` — web routes that require authentication

---

## Admin / Dashboard

Responsibilities:

- Admin home and dashboard pages
- Aggregated views and admin-only operations

Key files:

- `app/Http/Controllers/Admin/DashboardController.php`
- `resources/views/admin/*` — dashboard and admin pages

---

## Catalog (Categories & Products)

Responsibilities:

- Manage product categories and product catalog
- Maintain product attributes (sku, unit, unit_cost, quantity)
- Category <-> Product relationships

Key files and database:

- `app/Models/Category.php`
- `app/Models/Product.php`
- `app/Http/Controllers/Api/CategoryController.php`
- `app/Http/Controllers/Api/ProductController.php`
- `routes/api.php` — `Route::apiResource('categories', ...)` and `products`

Notes:

- Product model auto-calculates `total_value` on save.

---

## Inventory (Stock In / Stock Out)

Responsibilities:

- Record incoming stock (purchases, receipts)
- Record issued stock (requisition, issues)
- Track transaction meta like supplier, received_by, issued_to

Key files and database:

- `app/Models/StockIn.php` (table: `stock_in`)
- `app/Models/StockOut.php` (table: `stock_out`)
- `app/Http/Controllers/Api/StockInController.php`
- `app/Http/Controllers/Api/StockOutController.php`
- `routes/api.php` — API resource routes for stock-in/stock-out

---

## Purchase Requests & Purchase Orders

Responsibilities:

- Submit and manage purchase requests from users
- Generate purchase orders from approved requests
- Store request metadata and items (as JSON)

Key files:

- `app/Models/PurchaseRequest.php` — items and metadata are JSON-cast
- `app/Http/Controllers/PurchaseRequestController.php` (web)
- `app/Http/Controllers/Api/PurchaseRequestController.php` (API)
- `app/Http/Controllers/PurchaseOrderController.php`
- `routes/api.php` and `routes/web.php` — endpoints for listing/creating and PDF generation

---

## Document generation (PDFs)

Responsibilities:

- Generate printable PDFs for documents like Purchase Request, Purchase Order, Inspection Acceptance Report, Inventory Custodian Slip, Requisition Issue Slip, Property Acknowledgement Receipt

Key files:

- Controllers in `app/Http/Controllers/` such as `PurchaseRequestController.php`, `PurchaseOrderController.php`, `InspectionAcceptanceReportController.php`, `InventoryCustodianSlipController.php`, `RequisitionIssueSlipController.php`, `PropertyAcknowledgementReceiptController.php` implement `generatePDF`/`preview` actions
- Views under `resources/views/*` used for PDF templates

---

## Activity & User Logging

Responsibilities:

- Record system actions and basic audit trail
- Track user logins, operations and metadata

Key files:

- `app/Models/Activity.php`
- `app/Models/UserLog.php`
- `app/Http/Controllers/Api/ActivityController.php`
- `app/Http/Controllers/Api/UserLogController.php`

---

## Mail & Notifications

Responsibilities:

- Email notifications for purchase request submissions and status changes
- Render and send mailable templates

Key files:

- `app/Mail/PurchaseRequestSubmitted.php`
- `app/Mail/StatusChangedMail.php`
- `scripts/render_mailable.php` — helper for rendering mailables locally
- `MAILER_SETUP.md` — mail configuration notes

---

## Observers & Providers

Responsibilities:

- React to model events (e.g., purchase request lifecycle)
- Register services and bindings

Key files:

- `app/Observers/PurchaseRequestObserver.php` — listens to PR events
- `app/Providers/AppServiceProvider.php` — app-level bootstrapping

---

## API & Routes

Responsibilities:

- Expose RESTful API endpoints for SPA or external integration
- Separate `routes/api.php` and `routes/web.php` for API vs web UI

Key files:

- `routes/api.php` — API routes for categories, products, stock-in/out, user-logs, purchase-requests, activities
- `routes/web.php` — web routes and PDF generation endpoints

---

## How to navigate quickly

- Start with `routes/api.php` and `routes/web.php` to see the public surface.
- Inspect controllers in `app/Http/Controllers/Api/` for API behavior and request validation.
- Inspect `app/Models/` for core domain data models and casts (JSON columns, dates).
- PDF templates live in `resources/views/` — open the templates referenced by `generatePDF` methods.

## Next steps / Suggested improvements

- Add small README files per module (e.g., `docs/catalog.md`) describing the model relationships and sample API payloads.
- Create a diagrams folder with a simple architecture diagram (ERD + flow for PR → PO → StockIn).
- Add tests for core flows: create PR, approve PR, generate PO, stock in/out adjustments.

---

If you'd like, I can (pick one):

- generate per-module README files with example requests/responses,
- create a high-level architecture diagram, or
- add a small test suite that exercises the Purchase Request flow.
