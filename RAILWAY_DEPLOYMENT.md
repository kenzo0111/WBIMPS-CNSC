# Railway Deployment Guide

## Overview

This guide will help you deploy the Supply and Property Management System to Railway using GitHub integration.

## Prerequisites

1. GitHub account
2. Railway account (https://railway.app)
3. Railway CLI installed (optional, for local deployment)

## Method 1: GitHub Integration (Recommended)

### Step 1: Prepare Your Repository

1. Ensure all your code is committed and pushed to GitHub
2. Make sure the following files are in your repository:
   - `composer.json`
   - `package.json`
   - `artisan`
   - `.env.example`

### Step 2: Connect to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select the `WBIMPS-CNSC` repository
6. Choose the `Playground` branch (or main branch)

### Step 3: Configure the Project

Railway will automatically detect this as a Laravel application and set up:

- PHP 8.2 runtime environment
- MySQL database with automatic provisioning
- Node.js for asset compilation
- Automatic SSL certificate generation
- Optimized build process for Laravel

**Note**: The application uses Railway's default Laravel detection. Custom nixpacks configurations have been removed to ensure compatibility.

### Step 4: Environment Variables

Set these environment variables in Railway:

```
APP_NAME=Supply and Property Management System
APP_ENV=production
APP_DEBUG=false
APP_KEY= # Generate with: php artisan key:generate --show
APP_URL=${{RAILWAY_STATIC_URL}}

DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_DATABASE=${{MYSQLDATABASE}}
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=log
LOG_CHANNEL=stderr
```

### Step 5: Database Setup

1. Railway automatically provisions a MySQL database
2. Run migrations: `php artisan migrate`
3. Seed the database: `php artisan db:seed`

### Step 6: Build Assets

Railway will automatically run:

```bash
composer install --optimize-autoloader --no-dev
npm ci
npm run build
```

## Method 2: Railway CLI Deployment

### Install Railway CLI

```bash
npm install -g @railway/cli
# or
curl -fsSL https://railway.app/install.sh | sh
```

### Deploy

```bash
railway login
railway init supply-system-spmo
railway up
```

## Post-Deployment Configuration

### 1. Generate Application Key

```bash
railway run php artisan key:generate
```

### 2. Run Migrations

```bash
railway run php artisan migrate
```

### 3. Create Admin User

```bash
railway run php artisan tinker
```

Then in Tinker:

```php
\App\Models\User::create([
    'name' => 'Admin User',
    'email' => 'admin@example.com',
    'password' => bcrypt('password123'),
    'is_admin' => true,
    'status' => 'active'
]);
```

### 4. Clear Cache

```bash
railway run php artisan config:cache
railway run php artisan route:cache
railway run php artisan view:cache
```

## Domain Configuration

Railway provides a default domain. You can:

1. Use Railway's default domain
2. Add a custom domain in the Railway dashboard

## SSL Certificate

Railway automatically provides SSL certificates for all domains.

## Monitoring

Railway provides:

- Application logs
- Database monitoring
- Performance metrics
- Error tracking

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check PHP version compatibility (8.2+)
   - Ensure all dependencies are in composer.json

2. **Database Connection**

   - Verify environment variables are set correctly
   - Check database credentials in Railway dashboard

3. **Asset Compilation**

   - Ensure Node.js version is compatible
   - Check package.json for build scripts

4. **Migration Failures**

   - If you see "duplicate column name" errors, the database may have stale migration state
   - Reset the database: `railway run php artisan migrate:fresh --seed`
   - This will drop all tables and re-run all migrations from scratch

5. **Permissions**
   - Laravel needs write permissions for storage/ and bootstrap/cache/
   - Railway handles this automatically

## Cost Estimation

Railway Free Tier:

- 512MB RAM
- 1GB storage
- Suitable for development/testing

Railway Pro Plans:

- From $5/month
- More resources and features

## Security Considerations

1. **Environment Variables**: Never commit secrets to GitHub
2. **Database**: Use Railway's managed MySQL
3. **Backups**: Enable automatic database backups
4. **Updates**: Keep Laravel and dependencies updated

## Support

- Railway Documentation: https://docs.railway.app/
- Laravel Deployment: https://laravel.com/docs/deployment
- GitHub Issues: Report issues in the repository
