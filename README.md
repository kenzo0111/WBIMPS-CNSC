# Supply and Property Management System

A Laravel-based web application for managing inventory and procurement workflows across the Camarines Norte State College Supply and Property Management Office (SPMO).

## ✨ Features

- **Access System:** PIN-based login with modal confirmations, loading states, and persistent user session handling.
- **Admin Dashboard:** Interactive SPA experience with sidebar navigation, requisition tracking, purchase order tooling, and notification center.
- **Purchase Orders:** Multi-step wizard for building PO documents, item management, and document toggles (ICS, RIS, PAR, IAR).
- **Roles & Users:** Mock data scaffolding for roles management, member listings, and quick actions.

## 🏗️ Tech Stack

- **Backend:** Laravel 11, PHP 8.2+
- **Frontend:** Blade, Vite, modern ES modules, Lucide icons
- **Styling:** Tailored CSS modules per view (AccessSystem, dashboard, etc.)

## 🚀 Getting Started

```bash
# Install PHP dependencies
composer install

# Install frontend dependencies
npm install

# Build assets (or use `npm run dev` during development)


# Configure your environment
cp .env.example .env
php artisan key:generate

# Run migrations and seed the test user (PIN 123456)
php artisan migrate --seed
```

## 🔐 Test Credentials

- **Email:** `test@example.com`
- **Security PIN:** `123456`

These seed values land you on the admin dashboard after authentication.

## 🧪 Running Tests

```bash
php artisan test
```

## 📁 Relevant Routes

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

## 📄 License

This project follows the MIT license. See the [LICENSE](LICENSE) file for details.
