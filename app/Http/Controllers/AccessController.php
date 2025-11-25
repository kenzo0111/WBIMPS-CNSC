<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class AccessController extends Controller
{
    /**
     * Display the access system login page.
     */
    public function show(): View
    {
        return view('access-system');
    }

    /**
     * Handle an incoming authentication request from the access system.
     */
    public function authenticate(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        /** @var \App\Models\User|null $user */
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 422);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Account is not activated. Please check your email for setup instructions.',
            ], 422);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        // Record login activity
        try {
            Activity::create([
                'action' => 'User logged in: ' . ($user->email ?? $user->name ?? 'Unknown'),
                'meta' => json_encode(['user_id' => $user->id ?? null]),
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record login activity', ['error' => $e->getMessage()]);
        }

        // Build a profile object that is compatible with legacy clients while preferring spatie roles
        $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames()->toArray() : [];
        $primaryRole = $roles[0] ?? data_get($user, 'role', 'Administrator');

        $profile = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $primaryRole,
            'roles' => $roles,
            // include permission names to help client-side authorization logic
            'permissionNames' => method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name')->toArray() : [],
            'is_admin' => (bool) ($user->isAdmin() ?? (bool) data_get($user, 'is_admin', false)),
        ];

        return response()->json([
            'message' => 'Login successful.',
            'redirect' => route('admin.dashboard'),
            'user' => $profile,
        ]);
    }

    /**
     * Log the authenticated user out of the application.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = Auth::user();
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Record logout activity
        try {
            Activity::create([
                'action' => 'User logged out: ' . ($user?->email ?? $user?->name ?? 'Unknown'),
                'meta' => json_encode(['user_id' => $user?->id ?? null]),
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record logout activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'message' => 'You have been signed out successfully.',
            'redirect' => route('login'),
        ]);
    }
}
