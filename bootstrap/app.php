<?php

use Illuminate\Foundation\Application;
// Include helpers (logical fallback for spatie/activitylog during migration)
if (file_exists(__DIR__ . '/../app/Helpers/activity_helper.php')) {
    require_once __DIR__ . '/../app/Helpers/activity_helper.php';
}
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'login',
            'logout',
            'forgot-password',
            'reset-password',
            'account/setup',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
