<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Activity;
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
            'pin' => ['required', 'digits:6'],
        ]);

        /** @var \App\Models\User|null $user */
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['pin'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or security PIN.',
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

        $profile = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => data_get($user, 'role', 'Administrator'),
            'department' => data_get($user, 'department', 'N/A'),
            'is_admin' => (bool) data_get($user, 'is_admin', false),
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
                'meta' => json_encode(['user_id' => $user->id ?? null]),
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
