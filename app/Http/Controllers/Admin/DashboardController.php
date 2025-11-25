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
            'roles' => method_exists($currentUser, 'getRoleNames') ? $currentUser->getRoleNames()->toArray() : [],
            // Use getAllPermissions to include permissions granted via roles and avoid caching issues
            'permissionNames' => method_exists($currentUser, 'getAllPermissions') ? $currentUser->getAllPermissions()->pluck('name')->toArray() : [],
            'role' => method_exists($currentUser, 'getRoleNames') ? $currentUser->getRoleNames()->first() ?? data_get($currentUser, 'role', 'Administrator') : data_get($currentUser, 'role', 'Administrator'),
            'is_admin' => (bool) ($currentUser->isAdmin() ?? (bool) data_get($currentUser, 'is_admin', false)),
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
