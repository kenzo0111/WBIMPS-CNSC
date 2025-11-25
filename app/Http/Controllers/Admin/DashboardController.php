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
        if ($currentUser) {
            // gather permission names (prefer actual getAllPermissions)
            $permissionNames = method_exists($currentUser, 'getAllPermissions') ? $currentUser->getAllPermissions()->pluck('name')->toArray() : [];
            if (empty($permissionNames)) {
                // fallback: map role -> permissions from config
                $roles = method_exists($currentUser, 'getRoleNames') ? $currentUser->getRoleNames()->toArray() : [];
                if (!empty($roles)) {
                    $mapping = config('roles_permissions.role_permissions', []);
                    $collected = [];
                    foreach ($roles as $r) {
                        if (isset($mapping[$r]) && is_array($mapping[$r])) {
                            $collected = array_merge($collected, $mapping[$r]);
                        }
                    }

                    $permissionNames = array_values(array_unique($collected));
                }
            }

            $currentUserData = [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'email' => $currentUser->email,
                'roles' => method_exists($currentUser, 'getRoleNames') ? $currentUser->getRoleNames()->toArray() : [],
                // Use getAllPermissions to include permissions granted via roles and avoid caching issues
                // If for any reason getAllPermissions returns empty (eg. permission cache or guard mismatch),
                // fall back to config/roles_permissions mapping so the UI still receives sensible defaults.
                'permissionNames' => $permissionNames,
                'role' => method_exists($currentUser, 'getRoleNames') ? $currentUser->getRoleNames()->first() ?? data_get($currentUser, 'role', 'Administrator') : data_get($currentUser, 'role', 'Administrator'),
                'is_admin' => (bool) ($currentUser->isAdmin() ?? (bool) data_get($currentUser, 'is_admin', false)),
            ];
        } else {
            $currentUserData = null;
        }

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
