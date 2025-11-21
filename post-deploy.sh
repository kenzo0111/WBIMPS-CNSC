#!/bin/bash

# Post-Deployment Setup Script for Railway
# Run this after successful deployment to set up the application

echo "🔧 Running post-deployment setup..."

# Generate application key if not set
echo "🔑 Generating application key..."
php artisan key:generate

# Run database migrations (use migrate:fresh if there are migration issues)
echo "🗄️ Running database migrations..."
php artisan migrate --force

# If migration fails with duplicate column errors, try fresh migration
if [ $? -ne 0 ]; then
    echo "⚠️ Migration failed. Trying fresh migration..."
    php artisan migrate:fresh --seed
else
    # Seed the database with initial data
    echo "🌱 Seeding database..."
    php artisan db:seed
fi

# Clear and cache configuration
echo "⚡ Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
echo "📁 Creating storage link..."
php artisan storage:link

# Set proper permissions (Railway handles this, but good practice)
echo "🔒 Setting permissions..."
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/

echo "✅ Post-deployment setup complete!"
echo ""
echo "🎉 Your Supply and Property Management System is ready!"
echo "📋 Next steps:"
echo "1. Create an admin user through the application"
echo "2. Configure email settings if needed"
echo "3. Set up any additional environment variables"
echo "4. Test all features thoroughly"