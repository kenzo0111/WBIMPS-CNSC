<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Password;

class AccountSetupController extends Controller
{
    public function showSetupForm($token)
    {
        // Verify token exists and get user
        $tokenData = DB::table('password_reset_tokens')
            ->where('token', $token)
            ->first();

        if (!$tokenData) {
            return redirect('/login')->with('error', 'Invalid or expired setup link.');
        }

        $user = User::where('email', $tokenData->email)->first();

        if (!$user || $user->status !== 'pending_activation') {
            return redirect('/login')->with('error', 'Account already activated or invalid.');
        }

        return view('account_setup', compact('token', 'user'));
    }

    public function setupAccount(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        $tokenData = DB::table('password_reset_tokens')
            ->where('token', $request->token)
            ->first();

        if (!$tokenData) {
            return back()->withErrors(['token' => 'Invalid or expired setup link.']);
        }

        $user = User::where('email', $tokenData->email)->first();

        if (!$user || $user->status !== 'pending_activation') {
            return back()->withErrors(['token' => 'Account already activated or invalid.']);
        }

        // Update user
        $user->update([
            'password' => Hash::make($request->password),
            'status' => 'active',
        ]);

        // Delete the token
        DB::table('password_reset_tokens')->where('token', $request->token)->delete();

        return redirect('/login')->with('success', 'Account setup complete. You can now log in.');
    }
}
