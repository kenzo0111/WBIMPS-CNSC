<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StockInController;
use App\Http\Controllers\Api\StockOutController;
use App\Http\Controllers\Api\UserLogController;
use App\Http\Controllers\Api\StatusRequestController;
use App\Http\Controllers\Api\PurchaseRequestController;

Route::get('/activities', [ActivityController::class, 'index']);
Route::post('/activities', [ActivityController::class, 'store']);

Route::apiResource('categories', CategoryController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('suppliers', App\Http\Controllers\Api\SupplierController::class);
Route::apiResource('stock-in', StockInController::class);
Route::apiResource('stock-out', StockOutController::class);
Route::apiResource('user-logs', UserLogController::class);
Route::get('/purchase-requests', [PurchaseRequestController::class, 'index']);
Route::post('/purchase-requests', [PurchaseRequestController::class, 'store']);
