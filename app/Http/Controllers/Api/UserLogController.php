<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserLog;
use Illuminate\Http\Request;

class UserLogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = UserLog::with('user');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('date_from')) {
            $query->where('timestamp', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('timestamp', '<=', $request->date_to);
        }

        $query->orderBy('timestamp', 'desc');

        $limit = $request->get('limit', 50);
        return response()->json(['data' => $query->limit($limit)->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'email' => 'required|string|email',
            'name' => 'required|string',
            'action' => 'required|string',
            'timestamp' => 'nullable|date',
            'ip_address' => 'nullable|string',
            'device' => 'nullable|string',
            'status' => 'string|default:Success',
        ]);

        if (!isset($validated['timestamp'])) {
            $validated['timestamp'] = now();
        }

        $log = UserLog::create($validated);
        return response()->json(['data' => $log], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(UserLog $userLog)
    {
        return response()->json(['data' => $userLog->load('user')]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, UserLog $userLog)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'email' => 'required|string|email',
            'name' => 'required|string',
            'action' => 'required|string',
            'timestamp' => 'nullable|date',
            'ip_address' => 'nullable|string',
            'device' => 'nullable|string',
            'status' => 'string',
        ]);

        $userLog->update($validated);
        return response()->json(['data' => $userLog->load('user')]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(UserLog $userLog)
    {
        $userLog->delete();
        return response()->json(['message' => 'User log deleted']);
    }
}
