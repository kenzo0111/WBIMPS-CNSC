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

// Human-friendly 'view' endpoints used by the dashboard chooser/popover.
// These accept an {id} parameter so client-side code can open a specific
// document preview page. They map to the existing preview actions when
// available or to dedicated preview controllers.
Route::get('/purchase-order/view/{id}', [PurchaseOrderController::class, 'preview'])->name('purchaseOrderView');
Route::get('/purchase-request/view/{id}', [PurchaseRequestController::class, 'preview'])->name('purchaseRequestView');
Route::get('/inventory-custodian-slip/view/{id}', [InventoryCustodianSlipController::class, 'preview'])->name('inventoryCustodianSlipView');
Route::get('/requisition-issue-slip/view/{id}', [RequisitionIssueSlipController::class, 'preview'])->name('requisitionIssueSlipView');
Route::get('/inspection-acceptance-report/view/{id}', [InspectionAcceptanceReportController::class, 'preview'])->name('inspectionAcceptanceReportView');
// PAR (Property Acknowledgement Receipt) preview handled by a dedicated controller.
Route::get('/property-acknowledgement-receipt/view/{id}', [PropertyAcknowledgementReceiptController::class, 'preview'])->name('propertyAcknowledgementReceiptView');

// PDF preview routes (development/testing)
// Appendix 71 preview now handled by the dedicated PropertyAcknowledgementReceiptController
Route::get('/pdf/preview/appendix71', [PropertyAcknowledgementReceiptController::class, 'preview'])->name('pdf.preview.appendix71');

Route::middleware('auth')->group(function () {
    Route::get('/contact-support', function () { return view('contact-support'); })->name('contact.support');
    Route::post('/contact-support', [App\Http\Controllers\SupportController::class, 'store'])->name('support.submit');
    Route::get('/support/attachment/{id}', [App\Http\Controllers\SupportController::class, 'attachment'])->name('support.attachment');
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/home', function () { return view('admin.home-page'); });
    Route::get('/user/home', function () { return view('user.user-home-page'); })->name('user.user-home-page');
    Route::get('/user/request', function () { return view('user.user-request'); })->name('user.request');
});

// API-style route for recent activities (uses web middleware so it shows in route:list)
// This provides a simple endpoint consumed by the dashboard client at /api/activities
use App\Http\Controllers\Api\ActivityController;
Route::get('/api/activities', [ActivityController::class, 'index']);
Route::post('/api/activities', [ActivityController::class, 'store']);


?>