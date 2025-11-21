#!/bin/bash

# Railway Deployment Script for Supply and Property Management System
# This script helps deploy the Laravel application to Railway

echo "🚀 Starting Railway Deployment Process..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    echo "or"
    echo "curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run:"
    echo "railway login"
    exit 1
fi

echo "✅ Railway CLI is ready"

# Create a new Railway project
echo "📦 Creating Railway project..."
railway init supply-system-spmo --source=. || {
    echo "❌ Failed to create Railway project"
    exit 1
}

# Set environment variables
echo "🔧 Configuring environment variables..."
railway variables set APP_NAME="Supply and Property Management System"
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false
railway variables set APP_URL=\${{RAILWAY_STATIC_URL}}
railway variables set DB_CONNECTION=mysql
railway variables set DB_HOST=\${{MYSQLHOST}}
railway variables set DB_PORT=\${{MYSQLPORT}}
railway variables set DB_DATABASE=\${{MYSQLDATABASE}}
railway variables set DB_USERNAME=\${{MYSQLUSER}}
railway variables set DB_PASSWORD=\${{MYSQLPASSWORD}}
railway variables set SESSION_DRIVER=database
railway variables set CACHE_STORE=database
railway variables set QUEUE_CONNECTION=database
railway variables set LOG_CHANNEL=stderr
railway variables set MAIL_MAILER=log

echo "✅ Environment variables configured"

# Deploy the application
echo "🚀 Deploying application..."
railway up || {
    echo "❌ Deployment failed"
    exit 1
}

echo "🎉 Deployment successful!"
echo "🌐 Your application will be available at: \$(railway domain)"
echo ""
echo "📋 Next steps:"
echo "1. Set up your database by running migrations"
echo "2. Create an admin user"
echo "3. Configure email settings if needed"
echo "4. Set up SSL certificate (Railway provides this automatically)"