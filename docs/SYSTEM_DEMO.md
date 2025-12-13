# System Demo Guide

This document explains how to run and present a concise demo of the Supply and Property Management System (SupplySystem). It includes setup, demo accounts, key features to highlight, step-by-step demo flows, and useful commands.

## Overview

- The application is a Laravel 12-based web system for inventory, procurement, and asset tracking.
- Demo flows emphasize requisition → purchase request → purchase order → receiving → inventory & documentation (PR/PO/IAR/PAR/RIS).

## Prerequisites

- PHP 8.2+ (recommended)
- Composer
- Node.js + npm
- MySQL / MariaDB
- (Optional) XAMPP for Windows local hosting

## Quick Setup (Local)

1. Clone the repository and cd into the project directory.

2. Install PHP dependencies

```bash
composer install
```

3. Install Node dependencies

```bash
npm install
```

4. Copy environment and generate key

```bash
cp .env.example .env
php artisan key:generate
```

5. Update `.env` with database credentials and mail config for local mail (e.g., Mailtrap) if testing email notifications.

6. Run migrations and seed demo data

```bash
php artisan migrate --seed
```

Notes:

- The `DatabaseSeeder` seeds a default admin and a test user. It also seeds permissions and items.
- If you want a fresh DB reset, use `php artisan migrate:fresh --seed`.

7. Build assets (or use dev mode)

```bash
npm run build
# development
npm run dev
```

8. Run the application

Option A: Use Laravel's built-in server

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Option B: Serve via XAMPP / Apache (place project in `htdocs`) and configure `.env` to the host + DB

9. Optional: If you changed `MAIL_` settings to use Mailtrap or a test SMTP, you can view the queued mail.

## Demo Accounts (Seeded)

- Admin: Email: `admin@example.com` Password: `admin123`
- Test User: Email: `test@example.com` Password: `123456`

The admin user has the `System Admin` role (Spatie) and can view all admin features.

## Key Features to Demonstrate

- Authentication (Email/PIN-based login flows)
- Admin Dashboard: real-time counts, navigation, notifications
- Purchase Requests: create, edit, status changes, and notifications
- Purchase Orders: create from a PR, add suppliers & cost, mark received
- Inventory: stock-in/stock-out, low-stock alerts, item management
- Document Generation: PR/PO/IAR/PAR/RIS PDFs from UI or API
- Role Management: create & assign roles with permissions
- Audit & Activity logs: show activity history for actions
- Support Tickets: create and attach files (if configured)
- Site Content: update and view dynamic campus/site content

## Step-by-Step Demo Flow (Recommended ~12 minutes)

1. Login as admin (admin@example.com / admin123) and briefly show the Dashboard overview (requisition counts, notifications, charts).

2. Create a Purchase Request (PR)

   - Navigate: `Purchase Requests` → `Create PR` (or the `+ New` button)
   - Add a requester, choose Items (from seeded data), set quantities.
   - Submit and show PR created with a generated request ID.

3. Show PR Status & Notifications

   - Demonstrate updating the PR status to 'Approved' or 'For Approval' and show notification generation (and mail if configured).

4. Create a Purchase Order (PO) from an Approved PR

   - Use the UI option to create a PO from a PR, add supplier details and unit costs.
   - Save the PO; show generated PO number.

5. Mark PO as received and show Inventory and IAR

   - Update PO status to `Received` (or `Delivered`), show that Inventory is updated accordingly.
   - Create/generate the `Inventory Custodian Slip (IAR)` and download/preview the PDF.

6. Generate Document PDFs

   - Generate PR, PO, IAR, PAR, and RIS PDFs from the UI and open each PDF preview to show layout and data.
   - Show the API endpoints available to generate PDFs programmatically if desired.

7. Issue Items and RIS

   - Create a `Requisition & Issue Slip (RIS)` to issue items to a requester and show inventory decremented.

8. Show User & Role Management and Activity Logs

   - View `Users`, show a user assigned to a role; show `Roles` and the `Permission` mappings (Spatie).
   - Open `Activity Logs` to demonstrate audit trail for actions taken during the demo.

9. Wrap up by showing `Reports` or `Download CSV` functions (if present), and show how a user can export PR/PO data.

## Useful Commands for the Demo

- Reset DB and seed demo data (useful to reset app state during demos)

```bash
php artisan migrate:fresh --seed
```

- Run tests (if you want to show automated checks)

```bash
php artisan test
# or using Pest
./vendor/bin/pest --parallel
```

- Generate roles & permissions from config (useful to sync roles if config changed)

```bash
php artisan roles:sync
```

- Create sample data at runtime (if you added custom seeders)

```bash
php artisan db:seed --class=\Database\Seeders\ItemSeeder
```

- View queued emails (when using a local SMTP like Mailtrap)

```bash
# no direct command; view via Mailtrap UI or local mail driver
```

## API Quick Actions

- Generate document PDFs programmatically:

  - `POST /purchase-request/generate` (or `GET preview`)
  - `POST /purchase-order/generate`
  - `POST /inventory-custodian-slip/generate`
  - `POST /requisition-issue-slip/generate`

- Programmatic API endpoints for CRUD operations are under `/api/*` (see `routes/api.php`). Use an API token or Postman for quick automation.

## Troubleshooting & Notes

- Ensure your DB credentials in `.env` are correct and the DB user has privileges to create tables.
- If `spatie/laravel-permission` is installed, run `php artisan roles:sync` after migrations to ensure role mappings are present.
- The application uses `dompdf` server-side PDF generation — if binary issues occur, check the `config/dompdf.php` and PHP extensions like `ext-gd` / `ext-mbstring`.
- When serving via XAMPP, ensure `storage` and `bootstrap/cache` are writable and point `APP_URL` to local host.
- For email testing, use Mailtrap or log driver to avoid spam.

---

If you want, I can now also:

- Add the short system demo script into `README.md` or a separate `docs/SYSTEM_DEMO.md` file (I added this document for you).
- Create a short `demo.sh`/`demo.bat` script to automate start/reset steps in development.
- Create a `DEMO.md` printable slide-based checklist for live walkthroughs.

Would you like me to add a `demo.bat` script for Windows with the common commands? (Yes/No)
