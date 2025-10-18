<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Activity;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 8);
        $items = Activity::orderBy('created_at', 'desc')->limit($limit)->get();
        return response()->json(['data' => $items]);
    }

    /**
     * Create a new activity record (used by client-side events).
     */
    public function store(Request $request)
    {
        $payload = $request->validate([
            'action' => ['required', 'string', 'max:1024'],
            'meta' => ['nullable'],
        ]);

        $activity = Activity::create([
            'action' => $payload['action'],
            'meta' => is_array($payload['meta']) ? $payload['meta'] : ($payload['meta'] ?? null),
        ]);

        return response()->json(['data' => $activity], 201);
    }
}
