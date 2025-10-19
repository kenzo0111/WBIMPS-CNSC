<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PurchaseRequest;
use Illuminate\Support\Str;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        // Return latest requests, optionally filtered by department or status
        $q = PurchaseRequest::query();
        if ($request->has('department') && $request->department !== 'All') {
            $q->where('department', $request->department);
        }
        if ($request->has('status') && $request->status !== 'All') {
            $q->where('status', $request->status);
        }

        $results = $q->orderBy('submitted_at', 'desc')->get();
        return response()->json($results);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'requester' => 'required|string',
            'department' => 'required|string',
            'items' => 'required',
            'unit' => 'nullable|string',
            'neededDate' => 'nullable|date',
            'priority' => 'nullable|string',
        ]);

        // Accept items as string or array; normalize to array
        $items = $data['items'];
        if (!is_array($items)) {
            // split lines as simple heuristic, or keep as single item
            $items = preg_split('/\r?\n/', $items);
            $items = array_values(array_filter(array_map('trim', $items)));
        }

        $currentYear = now()->year;
        $count = PurchaseRequest::count() + 1;
        $requestId = sprintf('REQ-%d-%03d', $currentYear, $count);

        $pr = PurchaseRequest::create([
            'request_id' => $requestId,
            'email' => $data['email'],
            'requester' => $data['requester'],
            'department' => $data['department'],
            'items' => $items,
            'unit' => $data['unit'] ?? null,
            'needed_date' => $data['neededDate'] ?? null,
            'priority' => $data['priority'] ?? 'Low',
            'status' => 'Incoming',
            'submitted_at' => now(),
            'metadata' => [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ],
        ]);

        return response()->json($pr, 201);
    }
}
