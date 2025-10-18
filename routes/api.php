<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ActivityController;

Route::get('/activities', [ActivityController::class, 'index']);
