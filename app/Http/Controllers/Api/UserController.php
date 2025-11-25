<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AccountSetupMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Return user list with role-metadata (maintain legacy `role` while preferring spatie)
        return User::orderBy('created_at', 'desc')->get()->map(function (User $u) {
            $roles = method_exists($u, 'getRoleNames') ? $u->getRoleNames()->toArray() : [];
            $primary = $roles[0] ?? data_get($u, 'role', null);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $primary,
                'roles' => $roles,
                'status' => $u->status,
                'is_admin' => (bool) ($u->isAdmin() ?? (bool) data_get($u, 'is_admin', false)),
                'created_at' => $u->created_at,
            ];
        })->values();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'nullable|string|max:255',
            'is_admin' => 'boolean',
        ]);

        // Create user with pending activation
        // Create user (don't write legacy `role` / `is_admin` columns — use spatie roles instead)
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'status' => 'pending_activation',
            'password' => Hash::make(Str::random(32)), // Temporary password
        ]);

        // If role provided, attach it using spatie (create role on demand)
        if ($request->filled('role') && method_exists($user, 'assignRole')) {
            $roleName = $request->role;
            // try assign directly; if role doesn't exist, create it via slug
            try {
                $user->assignRole($roleName);
            } catch (\Throwable $e) {
                $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $roleName), '-'));
                \Spatie\Permission\Models\Role::firstOrCreate(['slug' => $slug], ['name' => $roleName, 'guard_name' => 'web']);
                $user->assignRole($roleName);
            }
        }

        // If `is_admin` was provided but no explicit role, map that flag to the 'Administrator' role.
        if (!$request->filled('role') && $request->boolean('is_admin', false) && method_exists($user, 'assignRole')) {
            // map the legacy is_admin flag to the canonical 'System Admin' role by default
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
            $user->assignRole('System Admin');
        }

        // Generate setup token
        $token = Str::random(64);
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => $token,
            'created_at' => now(),
        ]);

        // Send setup email
        Mail::to($user->email)->send(new AccountSetupMail($user, $token));

        return response()->json([
            'message' => 'User created successfully. Account setup email sent.',
            'user' => $user,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return $user;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            // keep `role` / `is_admin` in validation so front-end can still send them, but we will map
            // them to spatie roles instead of updating legacy columns.
            'role' => 'nullable|string|max:255',
            'is_admin' => 'boolean',
            'status' => 'in:active,inactive,pending_activation',
        ]);

        // Update core attributes only (don't attempt to update removed `role`/`is_admin` database columns)
        $user->update($request->only(['name', 'email', 'status']));

        // Sync role via spatie if provided
        if ($request->filled('role') && method_exists($user, 'syncRoles')) {
            try {
                $user->syncRoles([$request->role]);
            } catch (\Throwable $e) {
                $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $request->role), '-'));
                \Spatie\Permission\Models\Role::firstOrCreate(['slug' => $slug], ['name' => $request->role, 'guard_name' => 'web']);
                $user->syncRoles([$request->role]);
            }
        }

        // If role not provided, but is_admin toggled, map that boolean to admin role membership.
        if (!$request->filled('role') && $request->has('is_admin') && method_exists($user, 'syncRoles')) {
            if ($request->boolean('is_admin')) {
                // Ensure System Admin exists and add it
                \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
                if (!$user->hasRole('System Admin')) {
                    $user->assignRole('System Admin');
                }
            } else {
                // remove the known admin roles if it's being turned off
                if ($user->hasRole('System Admin'))
                    $user->removeRole('System Admin');
                if ($user->hasRole('Administrator'))
                    $user->removeRole('Administrator');
            }
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.',
        ]);
    }
}
