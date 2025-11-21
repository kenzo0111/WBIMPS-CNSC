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
        $user = request()->user();
        if (!($user && $user->is_admin === true)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return User::select('id', 'name', 'email', 'role', 'status', 'is_admin', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!($user && $user->is_admin === true)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'nullable|string|max:255',
            'is_admin' => 'boolean',
        ]);

        // Create user with pending activation
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'is_admin' => $request->boolean('is_admin', false),
            'status' => 'pending_activation',
            'password' => Hash::make(Str::random(32)), // Temporary password
        ]);

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
        $authUser = $request->user();
        if (!($authUser && $authUser->is_admin === true)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role' => 'nullable|string|max:255',
            'is_admin' => 'boolean',
            'status' => 'in:active,inactive,pending_activation',
        ]);

        $user->update($request->only(['name', 'email', 'role', 'is_admin', 'status']));

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
        $authUser = request()->user();
        if (!($authUser && $authUser->is_admin === true)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.',
        ]);
    }
}
