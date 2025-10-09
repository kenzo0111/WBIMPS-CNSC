<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use App\Commands\ServeDashboard;

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
    }
}
