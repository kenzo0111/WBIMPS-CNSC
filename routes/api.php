<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseRequestController;
use App\Http\Controllers\Api\StockInController;
use App\Http\Controllers\Api\StockOutController;
use App\Http\Controllers\Api\SupportController as ApiSupportController;
use App\Http\Controllers\Api\UserLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Apply rate limiting to all API routes: 60 requests per minute
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::post('/activities', [ActivityController::class, 'store']);

    Route::apiResource('categories', CategoryController::class);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('suppliers', App\Http\Controllers\Api\SupplierController::class);
    Route::apiResource('stock-in', StockInController::class);
    Route::apiResource('stock-out', StockOutController::class);
    Route::apiResource('user-logs', UserLogController::class);
    Route::apiResource('users', App\Http\Controllers\Api\UserController::class);
    Route::get('/purchase-requests', [PurchaseRequestController::class, 'index']);
    Route::post('/purchase-requests', [PurchaseRequestController::class, 'store']);
    // Update status for a purchase request (accepts request_id like REQ-2025-007 or numeric id)
    Route::post('/status-requests/{id}/status', [PurchaseRequestController::class, 'updateStatus']);
    // Purchase Order API routes
    Route::apiResource('purchase-orders', App\Http\Controllers\Api\PurchaseOrderController::class);
    Route::post('/purchase-orders/{id}/status', [App\Http\Controllers\Api\PurchaseOrderController::class, 'updateStatus']);
    // Geocoding proxy endpoint
    Route::get('/geocode', [App\Http\Controllers\GeocodeController::class, 'index']);

    // Support tickets API
    Route::get('/support-tickets', [ApiSupportController::class, 'index']);
    Route::get('/support-tickets/{id}', [ApiSupportController::class, 'show']);
    Route::post('/support-tickets/{id}/status', [ApiSupportController::class, 'updateStatus']);
});
