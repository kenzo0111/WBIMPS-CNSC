<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SiteContentController extends Controller
{
    /**
     * Show the content by key.
     */
    public function show(string $key)
    {
        $content = SiteContent::where('key', $key)->first();
        if (!$content) {
            return response()->json(['data' => null]);
        }
        return response()->json(['data' => $content->value]);
    }

    /**
     * Update or create the content by key.
     */
    public function update(Request $request, string $key)
    {
        // Ensure only administrators can update site content
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Authentication required'], 401);
        }

        if (!method_exists($user, 'isAdmin') || !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden: admin access required'], 403);
        }
        // Validate minimal: value must be array/object
        $validated = $request->validate([
            'value' => 'required|array',
        ]);

        $content = SiteContent::updateOrCreate(
            ['key' => $key],
            ['value' => $validated['value']]
        );

        return response()->json(['data' => $content->value]);
    }
}
