# Supply and Property Management System

A Laravel-based web application for managing inventory and procurement workflows across the Camarines Norte State College Supply and Property Management Office (SPMO).

## ✨ Features

- **Access System:** PIN-based login with modal confirmations, loading states, and persistent user session handling.
- **Admin Dashboard:** Interactive SPA experience with sidebar navigation, requisition tracking, purchase order tooling, and notification center.
- **Purchase Orders:** Multi-step wizard for building PO documents, item management, and document toggles (ICS, RIS, PAR, IAR).
- **Roles & Users:** Mock data scaffolding for roles management, member listings, and quick actions.

## 🏗️ Tech Stack

- **Backend:** Laravel 12, PHP 8.2+
- **Frontend:** Blade, Vite, modern ES modules, Lucide icons
- **Styling:** Tailored CSS modules per view (AccessSystem, dashboard, etc.)

### Local Development

# Install PHP dependencies

composer install

# Install frontend dependencies

npm install

# Build assets (or use `npm run dev` during development)

npm run build

# Configure your environment

cp .env.example .env
php artisan key:generate

# Run migrations and seed the test user (PIN 123456)

php artisan migrate --seed

### Role-based permissions (Spatie)

This project now supports spatie/laravel-permission for roles & permissions.

To enable locally after pulling this change:

1. Ensure composer dependencies are installed:

   composer install

2. Publish vendor assets (optional):

   php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

3. Run migrations (the repository includes migrations + a data migration that converts the legacy `users.role` and `users.is_admin` values into the new roles tables):

   php artisan migrate

4. Seed the example roles (optional):

   php artisan db:seed --class=\\Database\\Seeders\\PermissionSeeder

Alternatively, to centrally enforce the roles/permissions mapping (recommended for production deployments), use the new artisan command which reads from config/roles_permissions.php and syncs the database:

php artisan roles:sync

Add that command to your deployment script or CI/CD pipeline to ensure roles and permissions are kept in sync with the canonical config.

For a human-friendly, canonical listing of each role and its permissions, see: `docs/reference/roles-permissions.md`.

Notes: The `User` model uses `HasRoles` and includes compatibility wrappers so existing `role` and `is_admin` checks continue to work while you migrate to spatie permissions.

## 🔐 Test Credentials

- **Email:** `admin@example.com`
- **Password:** `admin123`

These seed values land you on the admin dashboard after authentication.

## 🧪 Running Tests

php artisan test

## �📁 Relevant Routes

- `/login` — Access System login screen
- `/admin/dashboard` — Authenticated admin SPA dashboard
- `/contact-support`, `/forms/*`, `/user/*` — Additional views gated behind auth middleware
- `/purchase-request/generate`, `/purchase-order/generate`, `/inspection-acceptance-report/generate`, `/inventory-custodian-slip/generate` — Backend endpoints for programmatic PDF generation (interactive fill forms have been retired)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Please run tests and `npm run build` before submitting PRs.

## � Documentation

- **[TODOLIST.md](TODOLIST.md)** - Project completion status

## �📄 License

This project follows the MIT license. See the [LICENSE](LICENSE) file for details.
