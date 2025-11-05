<?php

namespace App\Http\Controllers;

use App\Mail\PasswordResetRequestMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\View\View;

class PasswordResetController extends Controller
{
    /**
     * Show the forgot password form.
     */
    public function showForgotForm(): View
    {
        return view('forgot-password');
    }

    /**
     * Handle forgot password request - send reset email to user
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'We could not find a user with that email address.',
            ], 404);
        }

        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Generate new reset token
        $token = Str::random(64);

        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => $token,
            'created_at' => now(),
        ]);

        // Send reset email directly to the user's email
        Mail::to($user->email)->send(new PasswordResetRequestMail($user, $token));

        return response()->json([
            'message' => 'Password reset link has been sent to your email address.',
        ]);
    }

    /**
     * Show the password reset form.
     */
    public function showResetForm(string $token): View
    {
        $tokenData = DB::table('password_reset_tokens')
            ->where('token', $token)
            ->first();

        if (! $tokenData) {
            abort(404, 'Invalid or expired reset token.');
        }

        // Check if token is expired (24 hours)
        $createdAt = \Carbon\Carbon::parse($tokenData->created_at);
        if ($createdAt->addHours(24)->isPast()) {
            DB::table('password_reset_tokens')->where('token', $token)->delete();
            abort(404, 'This reset link has expired. Please request a new one.');
        }

        return view('reset-password', [
            'token' => $token,
            'email' => $tokenData->email,
        ]);
    }

    /**
     * Handle password reset.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $tokenData = DB::table('password_reset_tokens')
            ->where('token', $request->token)
            ->first();

        if (! $tokenData) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 404);
        }

        // Check if token is expired (24 hours)
        $createdAt = \Carbon\Carbon::parse($tokenData->created_at);
        if ($createdAt->addHours(24)->isPast()) {
            DB::table('password_reset_tokens')->where('token', $request->token)->delete();

            return response()->json([
                'message' => 'This reset link has expired. Please request a new one.',
            ], 410);
        }

        $user = User::where('email', $tokenData->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the token
        DB::table('password_reset_tokens')->where('token', $request->token)->delete();

        return response()->json([
            'message' => 'Your password has been reset successfully. You can now login with your new password.',
            'redirect' => route('login'),
        ]);
    }
}
