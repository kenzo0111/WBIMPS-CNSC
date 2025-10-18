<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class DashboardController extends Controller
{
    /**
     * Display the administrative dashboard.
     */
    public function index(): View
    {
        $currentUser = Auth::user();
        $currentUserData = $currentUser ? [
            'id' => $currentUser->id,
            'name' => $currentUser->name,
            'email' => $currentUser->email,
            'role' => data_get($currentUser, 'role', 'Administrator'),
            'department' => data_get($currentUser, 'department', 'N/A'),
            'is_admin' => (bool) data_get($currentUser, 'is_admin', false),
        ] : null;

        return view('admin.dashboard', [
            'currentUser' => $currentUser,
            'currentUserData' => $currentUserData,
            'metrics' => [
                'userCount' => User::count(),
                'latestUsers' => User::latest()->take(5)->get(),
            ],
        ]);
    }
}
