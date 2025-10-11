<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccessController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\InspectionAcceptanceReportController;
use App\Http\Controllers\InventoryCustodianSlipController;
use App\Http\Controllers\RequisitionIssueSlipController;
use App\Http\Controllers\PropertyAcknowledgementReceiptController;
use App\Http\Controllers\PdfPreviewController;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('admin.dashboard')
        : redirect()->route('login');
});

Route::get('/login', [AccessController::class, 'show'])->name('login');
Route::post('/login', [AccessController::class, 'authenticate'])->name('login.perform');
Route::post('/logout', [AccessController::class, 'logout'])->name('logout');
Route::post('/purchase-request/generate', [PurchaseRequestController::class, 'generatePDF'])->name('purchase-request.generate');
Route::get('/purchase-request/preview', [PurchaseRequestController::class, 'preview'])->name('purchase-request.preview');
Route::post('/purchase-order/generate', [PurchaseOrderController::class, 'generatePDF'])->name('purchase-order.generate');
Route::get('/purchase-order/preview', [PurchaseOrderController::class, 'preview'])->name('purchase-order.preview');
Route::post('/inspection-acceptance-report/generate', [InspectionAcceptanceReportController::class, 'generatePDF'])->name('inspection-acceptance-report.generate');
Route::get('/inspection-acceptance-report/preview', [InspectionAcceptanceReportController::class, 'preview'])->name('inspection-acceptance-report.preview');
Route::post('/inventory-custodian-slip/generate', [InventoryCustodianSlipController::class, 'generatePDF'])->name('inventory-custodian-slip.generate');
Route::get('/inventory-custodian-slip/preview', [InventoryCustodianSlipController::class, 'preview'])->name('inventory-custodian-slip.preview');
Route::post('/requisition-issue-slip/generate', [RequisitionIssueSlipController::class, 'generatePDF'])->name('requisition-issue-slip.generate');
Route::get('/requisition-issue-slip/preview', [RequisitionIssueSlipController::class, 'preview'])->name('requisition-issue-slip.preview');

// PDF preview routes (development/testing)
Route::get('/pdf/preview/appendix71', [PdfPreviewController::class, 'previewAppendix71'])->name('pdf.preview.appendix71');

Route::middleware('auth')->group(function () {
    Route::get('/contact-support', function () { return view('contact-support'); })->name('contact.support');
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/home', function () { return view('admin.home-page'); });
    Route::get('/user/home', function () { return view('user.user-home-page'); })->name('user.user-home-page');
    Route::get('/user/request', function () { return view('user.user-request'); })->name('user.request');
});


?>