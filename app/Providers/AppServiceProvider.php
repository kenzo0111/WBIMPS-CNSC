<?php

namespace App\Providers;

use App\Commands\ServeDashboard;
use App\Models\PurchaseRequest;
use App\Observers\PurchaseRequestObserver;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Share the public images base URL with all Blade views
        // Usage in Blade: <img src="{{ $imagesPath }}/logo.png" alt="...">
        View::share('imagesPath', asset('images'));

        // Register custom commands
        $this->commands([
            ServeDashboard::class,
        ]);

        // Register model observers
        PurchaseRequest::observe(PurchaseRequestObserver::class);

        // Register spatie middleware aliases (role, permission) when package is available
        if (class_exists(\Spatie\Permission\Middlewares\RoleMiddleware::class) && $this->app->bound('router')) {
            $router = $this->app->make(\Illuminate\Routing\Router::class);
            $router->aliasMiddleware('role', \Spatie\Permission\Middlewares\RoleMiddleware::class);
            $router->aliasMiddleware('permission', \Spatie\Permission\Middlewares\PermissionMiddleware::class);
        }
    }
}
