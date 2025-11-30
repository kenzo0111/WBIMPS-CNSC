<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * API Controller for managing Purchase Requests
 *
 * Handles CRUD operations for purchase requests, including filtering,
 * status updates, and cost calculations.
 */
class PurchaseRequestController extends Controller
{
    /**
     * Display a listing of purchase requests.
     *
     * Supports filtering by department and status.
     * Automatically calculates total cost for each request.
     *
     * @return \Illuminate\Http\JsonResponse
     */
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

        // Calculate total_cost for each request (prefer stored value; otherwise compute from unit_cost * quantity)
        $results = $results->map(function ($request) {
            $data = $request->toArray();
            $unitCost = $request->unit_cost ?? null;
            $quantity = $request->quantity ?? null;
            // prefer to compute total_cost from available unit_cost and quantity so it stays accurate
            if (is_numeric($unitCost) && is_numeric($quantity)) {
                $data['total_cost'] = (float) $unitCost * (int) $quantity;
            } else {
                $data['total_cost'] = is_numeric($request->total_cost) ? (float) $request->total_cost : ($unitCost * ($quantity ?? 0));
            }

            return $data;
        });

        return response()->json($results);
    }

    /**
     * Store a newly created purchase request.
     *
     * Validates input data and creates a new purchase request with
     * a unique request ID in the format: REQ-YYYY-XXX
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'requester' => 'required|string',
            'designation' => 'nullable|string',
            'department' => 'required|string',
            'items' => 'required',
            'unit' => 'nullable|string',
            'purpose' => 'required|string',
            // support either camelCase (unitCost) from the JS form or snake_case (unit_cost)
            'unitCost' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
            'totalCost' => 'nullable|numeric|min:0',
            'total_cost' => 'nullable|numeric|min:0',
            // 'neededDate' must be today or later to prevent backdating
            'neededDate' => 'nullable|date|after_or_equal:today',
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

        // Determine the next sequence number for the current year
        // Database-agnostic approach: fetch all IDs and parse in PHP
        $existingRequests = DB::table('purchase_requests')
            ->where('request_id', 'like', "REQ-{$currentYear}-%")
            ->pluck('request_id');

        $maxNum = 0;
        foreach ($existingRequests as $requestId) {
            // Extract the numeric suffix from "REQ-YYYY-NNN"
            if (preg_match('/REQ-\d{4}-(\d+)$/', $requestId, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $nextSeq = $maxNum + 1;

        $pr = null;
        $attempts = 0;
        $maxAttempts = 5;

        while (is_null($pr) && $attempts < $maxAttempts) {
            $requestId = sprintf('REQ-%d-%03d', $currentYear, $nextSeq);
            try {
                $pr = PurchaseRequest::create([
                    'request_id' => $requestId,
                    'email' => $data['email'],
                    'requester' => $data['requester'],
                    'designation' => $data['designation'] ?? null,
                    'department' => $data['department'],
                    'items' => $items,
                    'unit' => $data['unit'] ?? null,
                    // normalize quantity and unit_cost names from JS (unitCost) or API clients (unit_cost)
                    'quantity' => isset($data['quantity']) ? (int) $data['quantity'] : (isset($data['qty']) ? (int) $data['qty'] : null),
                    'unit_cost' => isset($data['unit_cost']) ? $data['unit_cost'] : (isset($data['unitCost']) ? $data['unitCost'] : null),
                    'purpose' => $data['purpose'] ?? null,
                    // compute total_cost when possible and persist it
                    // If client passed a totalCost/total_cost prefer that; otherwise compute from unit_cost.unitCost * quantity
                    'total_cost' => isset($data['total_cost']) ? (float) $data['total_cost'] : (isset($data['totalCost']) ? (float) $data['totalCost'] : (
                        ((isset($data['quantity']) || isset($data['qty'])) && (isset($data['unit_cost']) || isset($data['unitCost']))) ? (
                            ((int) ($data['quantity'] ?? $data['qty'] ?? 0)) * (float) (isset($data['unit_cost']) ? $data['unit_cost'] : ($data['unitCost'] ?? 0))
                        ) : null
                    )),
                    'needed_date' => $data['neededDate'] ?? null,
                    'priority' => $data['priority'] ?? 'Low',
                    'status' => 'Incoming',
                    'submitted_at' => now(),
                    'metadata' => [
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ],
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                // If there's a duplicate key for request_id, bump the sequence and retry.
                $sqlState = $e->getCode();
                if ($sqlState === '23000' || strpos($e->getMessage(), 'Duplicate') !== false) {
                    $nextSeq++;
                    $attempts++;

                    continue;
                }
                // rethrow unexpected DB errors
                throw $e;
            }
        }

        if (is_null($pr)) {
            return response()->json(['error' => 'Could not create purchase request, please try again'], 500);
        }

        // Send notification emails: to requester and to admins
        $emailSent = false;
        try {
            // Fetch emails for users who are in one of the admin roles
            $admins = \App\Models\User::whereHas('roles', function ($q) {
                $q->whereIn('name', ['System Admin', 'Administrator']);
            })->pluck('email')->filter()->toArray();
            // send to requester
            \Illuminate\Support\Facades\Mail::to($pr->email)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
            // send to admins (if any)
            if (!empty($admins)) {
                \Illuminate\Support\Facades\Mail::to($admins)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
            }
            $emailSent = true;
        } catch (\Exception $e) {
            // If the failure looks like an OpenSSL certificate verification error, try a single insecure fallback
            \Illuminate\Support\Facades\Log::error('Failed sending purchase request submitted email: ' . $e->getMessage());
            $msg = $e->getMessage();
            if (stripos($msg, 'certificate verify failed') !== false || stripos($msg, 'stream_socket_enable_crypto') !== false || stripos($msg, 'STARTTLS') !== false) {
                try {
                    \Illuminate\Support\Facades\Log::warning('Attempting insecure SMTP retry (verify_peer=false) due to TLS certificate verification failure');
                    // set runtime stream options for smtp mailer to bypass peer verification (development only)
                    config([
                        'mail.mailers.smtp.stream' => [
                            'ssl' => [
                                'allow_self_signed' => true,
                                'verify_peer' => false,
                                'verify_peer_name' => false,
                            ],
                        ]
                    ]);

                    // retry send once
                    \Illuminate\Support\Facades\Mail::to($pr->email)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
                    if (!empty($admins)) {
                        \Illuminate\Support\Facades\Mail::to($admins)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
                    }
                    $emailSent = true;
                    \Illuminate\Support\Facades\Log::warning('Insecure SMTP retry succeeded (email sent)');
                } catch (\Exception $e2) {
                    \Illuminate\Support\Facades\Log::error('Insecure SMTP retry failed: ' . $e2->getMessage());
                    $emailSent = false;
                }
            } else {
                $emailSent = false;
            }
        }

        return response()->json(array_merge($pr->toArray(), ['email_sent' => $emailSent]), 201);
    }

    /**
     * Update the status of a purchase request.
     *
     * Accepts either the numeric DB id or the request_id string (e.g., REQ-2025-007).
     * Logs status changes to the activity table for audit trail.
     *
     * @param  string|int  $id  Purchase request ID (numeric or request_id string)
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, $id)
    {
        $data = $request->validate([
            'status' => 'required|string',
        ]);

        // Try to locate by request_id first (eg. REQ-2025-007), then by numeric id
        $pr = PurchaseRequest::where('request_id', $id)->first();
        if (!$pr && is_numeric($id)) {
            $pr = PurchaseRequest::find((int) $id);
        }

        if (!$pr) {
            return response()->json(['error' => 'Purchase request not found'], 404);
        }

        $old = $pr->status;
        $pr->status = $data['status'];
        $pr->save();

        // Optionally log activity
        try {
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties(['request_id' => $pr->request_id ?? $pr->id])
                ->log(sprintf('Purchase request %s status changed from %s to %s', $pr->request_id ?? $pr->id, $old, $pr->status));
        } catch (\Exception $e) {
            // ignore logging failures
        }

        return response()->json($pr);
    }
}
