<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccessController;
use App\Http\Controllers\Admin\DashboardController;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('admin.dashboard')
        : redirect()->route('login');
});

Route::get('/login', [AccessController::class, 'show'])->name('login');
Route::post('/login', [AccessController::class, 'authenticate'])->name('login.perform');
Route::post('/logout', [AccessController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/contact-support', function () { return view('contact-support'); })->name('contact.support');
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/home', function () { return view('admin.home-page'); });
    Route::get('/user/home', function () { return view('user.user-home-page'); })->name('user.user-home-page');
    Route::get('/user/request', function () { return view('user.user-request'); })->name('user.request');
    Route::get('/forms/ics', function () { return view('forms.ics-form'); });
    Route::get('/forms/po-preview', function () { return view('forms.po-preview'); });
});


?>