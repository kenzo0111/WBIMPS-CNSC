<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\PurchaseRequestController;
use App\Http\Controllers\Api\StockInController;
use App\Http\Controllers\Api\StockOutController;
use App\Http\Controllers\Api\SupportController as ApiSupportController;
use App\Http\Controllers\Api\UserLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SiteContentController;

// Apply rate limiting to all API routes: 60 requests per minute
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::get('/activities/{id}', [ActivityController::class, 'show']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::get('/activities/{id}', [ActivityController::class, 'show']);
    Route::post('/activities', [ActivityController::class, 'store']);

    Route::apiResource('categories', CategoryController::class);
    Route::get('/items/low-stock', [ItemController::class, 'lowStock']);
    Route::apiResource('items', ItemController::class);
    Route::apiResource('suppliers', App\Http\Controllers\Api\SupplierController::class);
    Route::apiResource('stock-in', StockInController::class);
    Route::apiResource('stock-out', StockOutController::class);
    Route::post('/stock-out/batch', [StockOutController::class, 'batchStore']); // Batch submission endpoint
    Route::apiResource('user-logs', UserLogController::class);
    Route::apiResource('users', App\Http\Controllers\Api\UserController::class);
    Route::apiResource('roles', App\Http\Controllers\Api\RoleController::class);
    Route::get('/permissions', [App\Http\Controllers\Api\RoleController::class, 'permissions']);
    // Purchase Request routes moved to web.php to enforce auth
    // Route::get('/purchase-requests', [PurchaseRequestController::class, 'index']);
    // Route::post('/purchase-requests', [PurchaseRequestController::class, 'store']);
    // Route::post('/status-requests/{id}/status', [PurchaseRequestController::class, 'updateStatus']);

    // Purchase Order API routes
    Route::apiResource('purchase-orders', App\Http\Controllers\Api\PurchaseOrderController::class);
    Route::post('/purchase-orders/{id}/status', [App\Http\Controllers\Api\PurchaseOrderController::class, 'updateStatus']);

    // Requisition Issue Slip API routes
    Route::apiResource('requisition-issue-slips', App\Http\Controllers\Api\RequisitionIssueSlipController::class);
    // Geocoding proxy endpoint
    Route::get('/geocode', [App\Http\Controllers\GeocodeController::class, 'index']);

    // Support tickets API
    Route::get('/support-tickets', [ApiSupportController::class, 'index']);
    Route::get('/support-tickets/{id}', [ApiSupportController::class, 'show']);
    Route::post('/support-tickets/{id}/status', [ApiSupportController::class, 'updateStatus']);

    // Site content (About Us, etc.)
    Route::get('/site-contents/{key}', [SiteContentController::class, 'show']);
    Route::put('/site-contents/{key}', [SiteContentController::class, 'update']);
});

// Authenticated API routes
// NOTE: purchase request endpoints require session-based auth (web guard).
// Keeping these routes in api.php causes 401s for cookie-based sessions because
// the 'api' middleware group does not start the session. Move them to
// web.php where the 'web' middleware and session cookie auth are available.
// Route::middleware(['auth', 'throttle:60,1'])->group(function () {
//    Route::get('/purchase-requests', [PurchaseRequestController::class, 'index']);
//    Route::post('/purchase-requests', [PurchaseRequestController::class, 'store']);
//    Route::post('/status-requests/{id}/status', [PurchaseRequestController::class, 'updateStatus']);
//});
