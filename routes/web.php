<?php

use App\Http\Controllers\AccessController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\InspectionAcceptanceReportController;
use App\Http\Controllers\InventoryCustodianSlipController;
use App\Http\Controllers\PropertyAcknowledgementReceiptController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\Api\PurchaseRequestController as ApiPurchaseRequestController;
use App\Http\Controllers\RequisitionIssueSlipController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        return $user->isAdmin()
            ? redirect()->route('admin.dashboard')
            : redirect()->route('user.user-home-page');
    }
    return redirect()->route('login');
});

// Health check endpoint for deployment verification
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => app()->version(),
        'environment' => app()->environment(),
    ]);
});

Route::get('/login', [AccessController::class, 'show'])->name('login');
Route::post('/login', [AccessController::class, 'authenticate'])
    ->middleware('throttle:5,1') // 5 attempts per minute
    ->name('login.perform');
Route::post('/logout', [AccessController::class, 'logout'])->name('logout');

// Password reset routes
Route::get('/forgot-password', [App\Http\Controllers\PasswordResetController::class, 'showForgotForm'])->name('password.forgot');
Route::post('/forgot-password', [App\Http\Controllers\PasswordResetController::class, 'sendResetLink'])
    ->middleware('throttle:3,1') // 3 attempts per minute
    ->name('password.reset.send');
Route::get('/reset-password/{token}', [App\Http\Controllers\PasswordResetController::class, 'showResetForm'])->name('password.reset.form');
Route::post('/reset-password', [App\Http\Controllers\PasswordResetController::class, 'resetPassword'])->name('password.reset.update');

// Account setup routes
Route::get('/account/setup/{token}', [App\Http\Controllers\AccountSetupController::class, 'showSetupForm'])->name('account.setup');
Route::post('/account/setup', [App\Http\Controllers\AccountSetupController::class, 'setupAccount'])
    ->middleware('throttle:5,1') // 5 attempts per minute
    ->name('account.setup.post');
Route::post('/purchase-request/generate', [PurchaseRequestController::class, 'generatePDF'])->name('purchase-request.generate');
Route::get('/purchase-request/preview', [PurchaseRequestController::class, 'preview'])->name('purchase-request.preview');
Route::post('/purchase-order/generate', [PurchaseOrderController::class, 'generatePDF'])->name('purchase-order.generate');
Route::get('/purchase-order/preview', [PurchaseOrderController::class, 'preview'])->name('purchase-order.preview');
Route::get('/purchase-order/{id}/pdf', [PurchaseOrderController::class, 'downloadPDF'])->name('purchase-order.download');
Route::post('/purchase-order/{id}/archive', [PurchaseOrderController::class, 'archive'])->name('purchase-order.archive');
Route::post('/inspection-acceptance-report/generate', [InspectionAcceptanceReportController::class, 'generatePDF'])->name('inspection-acceptance-report.generate');
Route::get('/inspection-acceptance-report/preview', [InspectionAcceptanceReportController::class, 'preview'])->name('inspection-acceptance-report.preview');
Route::get('/inspection-acceptance-report/{id}/pdf', [InspectionAcceptanceReportController::class, 'downloadPDF'])->name('inspection-acceptance-report.download');
Route::post('/inventory-custodian-slip/generate', [InventoryCustodianSlipController::class, 'generatePDF'])->name('inventory-custodian-slip.generate');
Route::get('/inventory-custodian-slip/preview', [InventoryCustodianSlipController::class, 'preview'])->name('inventory-custodian-slip.preview');
Route::get('/inventory-custodian-slip/{id}/pdf', [InventoryCustodianSlipController::class, 'downloadPDF'])->name('inventory-custodian-slip.download');

// RIS routes (specific routes must come before dynamic {id} routes)
Route::get('/requisition-issue-slip', [RequisitionIssueSlipController::class, 'index'])->name('requisition-issue-slip.index');
Route::post('/requisition-issue-slip', [RequisitionIssueSlipController::class, 'store'])->name('requisition-issue-slip.store');
Route::post('/requisition-issue-slip/generate', [RequisitionIssueSlipController::class, 'generatePDF'])->name('requisition-issue-slip.generate');
Route::get('/requisition-issue-slip/preview', [RequisitionIssueSlipController::class, 'preview'])->name('requisition-issue-slip.preview');
Route::get('/requisition-issue-slip/view/{id}', [RequisitionIssueSlipController::class, 'preview'])->name('requisitionIssueSlipView');
Route::get('/requisition-issue-slip/{id}/pdf', [RequisitionIssueSlipController::class, 'downloadPDF'])->name('requisition-issue-slip.download');
Route::get('/requisition-issue-slip/{id}', [RequisitionIssueSlipController::class, 'show'])->name('requisition-issue-slip.show');

// PAR routes
Route::post('/property-acknowledgement-receipt/generate', [PropertyAcknowledgementReceiptController::class, 'generatePDF'])->name('property-acknowledgement-receipt.generate');
Route::get('/property-acknowledgement-receipt/{id}/pdf', [PropertyAcknowledgementReceiptController::class, 'downloadPDF'])->name('property-acknowledgement-receipt.download');

// Stock Out routes
Route::get('/stock-out/{id}/pdf', [App\Http\Controllers\StockOutController::class, 'downloadPDF'])->name('stock-out.download');

// Human-friendly 'view' endpoints used by the dashboard chooser/popover.
// These accept an {id} parameter so client-side code can open a specific
// document preview page. They map to the existing preview actions when
// available or to dedicated preview controllers.
Route::get('/purchase-order/view/{id}', [PurchaseOrderController::class, 'preview'])->name('purchaseOrderView');
Route::get('/purchase-request/view/{id}', [PurchaseRequestController::class, 'preview'])->name('purchaseRequestView');
Route::get('/inventory-custodian-slip/view/{id}', [InventoryCustodianSlipController::class, 'preview'])->name('inventoryCustodianSlipView');
Route::get('/inspection-acceptance-report/view/{id}', [InspectionAcceptanceReportController::class, 'preview'])->name('inspectionAcceptanceReportView');
// PAR (Property Acknowledgement Receipt) preview handled by a dedicated controller.
Route::get('/property-acknowledgement-receipt/view/{id}', [PropertyAcknowledgementReceiptController::class, 'preview'])->name('propertyAcknowledgementReceiptView');

// PDF preview routes (development/testing)
// Appendix 71 preview now handled by the dedicated PropertyAcknowledgementReceiptController
Route::get('/pdf/preview/appendix71', [PropertyAcknowledgementReceiptController::class, 'preview'])->name('pdf.preview.appendix71');

Route::middleware('auth')->group(function () {
    // Protected API routes
    Route::get('/api/purchase-requests', [ApiPurchaseRequestController::class, 'index']);
    Route::post('/api/purchase-requests', [ApiPurchaseRequestController::class, 'store']);
    Route::post('/api/status-requests/{id}/status', [ApiPurchaseRequestController::class, 'updateStatus']);

    Route::get('/contact-support', function () {
        return view('contact-support');
    })->name('contact.support');
    Route::post('/contact-support', [App\Http\Controllers\SupportController::class, 'store'])->name('support.submit');
    Route::get('/support/attachment/{id}', [App\Http\Controllers\SupportController::class, 'attachment'])->name('support.attachment');
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
});

Route::get('/admin/home', function () {
    return view('admin.home-page');
});

Route::get('/user/home', function () {
    return view('user.user-home-page');
})->name('user.user-home-page');

Route::middleware('auth')->group(function () {
    Route::get('/user/request', function () {
        return view('user.user-request');
    })->name('user.request');
});

// API-style route for recent activities (uses web middleware so it shows in route:list)
// This provides a simple endpoint consumed by the dashboard client at /api/activities
use App\Http\Controllers\Api\ActivityController;

Route::get('/api/activities', [ActivityController::class, 'index']);
Route::post('/api/activities', [ActivityController::class, 'store']);
Route::get('/api/activities/{id}', [ActivityController::class, 'show']);
