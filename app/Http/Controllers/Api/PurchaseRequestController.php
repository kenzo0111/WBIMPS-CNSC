<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\PurchaseRequestIdGenerator;

/**
 * API Controller for managing Purchase Requests
 *
 * Handles CRUD operations for purchase requests, including filtering,
 * status updates, and cost calculations.
 */
class PurchaseRequestController extends Controller
{
    public function __construct()
    {
        // When these controller actions are served via web middleware for AJAX,
        // exclude the POST endpoints from CSRF verification so API-style clients
        // and automated tests can operate without a CSRF token.
        $this->middleware(\App\Http\Middleware\VerifyCsrfToken::class)->except(['store', 'updateStatus']);
    }
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
     * a unique request ID in the format: YYYY-MM-XXXX (monthly, 4-digit sequence)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'requester' => 'required|string',
            'designation' => 'nullable|string',
            'approved_by' => 'nullable|string',
            'approvedBy' => 'nullable|string',
            'approved_position' => 'nullable|string',
            'approvedPosition' => 'nullable|string',
            'approverDesignation' => 'nullable|string',
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

        // Use centralized generator for request IDs
        $idGenerator = new PurchaseRequestIdGenerator();

        $pr = null;
        $attempts = 0;
        $maxAttempts = 5;

        while (is_null($pr) && $attempts < $maxAttempts) {
            $requestId = $idGenerator->nextBaseForPeriod();
            try {
                $pr = PurchaseRequest::create([
                    'request_id' => $requestId,
                    'email' => $data['email'],
                    'requester' => $data['requester'],
                    'designation' => $data['designation'] ?? null,
                    'approved_by' => $data['approved_by'] ?? ($data['approvedBy'] ?? null),
                    'approved_position' => $data['approved_position'] ?? ($data['approvedPosition'] ?? ($data['approverDesignation'] ?? null)),
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
                // If there's a duplicate key for request_id, retry (next loop will compute a fresh base)
                $sqlState = $e->getCode();
                if ($sqlState === '23000' || strpos($e->getMessage(), 'Duplicate') !== false) {
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

            \Illuminate\Support\Facades\Log::info('Attempting to send purchase request submitted email', ['requester' => $pr->email, 'admins' => $admins]);

            // send to requester if an email was provided
            if (filled($pr->email)) {
                \Illuminate\Support\Facades\Mail::to($pr->email)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
                \Illuminate\Support\Facades\Log::info('Purchase request submitted email sent to requester', ['to' => $pr->email, 'request_id' => $pr->request_id ?? $pr->id]);
            } else {
                \Illuminate\Support\Facades\Log::warning('No requester email provided; skipping requester notification', ['request_id' => $pr->request_id ?? $pr->id]);
            }

            // send to admins (if any)
            if (!empty($admins)) {
                \Illuminate\Support\Facades\Mail::to($admins)->send(new \App\Mail\PurchaseRequestSubmitted($pr));
                \Illuminate\Support\Facades\Log::info('Purchase request submitted email sent to admins', ['admins' => $admins, 'request_id' => $pr->request_id ?? $pr->id]);
            }

            // consider email sent if at least one send was attempted (and no exception was thrown)
            $emailSent = true;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed sending purchase request submitted email: ' . $e->getMessage());
            $emailSent = false;
        }

        return response()->json(array_merge($pr->toArray(), ['email_sent' => $emailSent]), 201);
    }

    /**
     * Update the status of a purchase request.
     *
     * Accepts either the numeric DB id or the request_id string (e.g., 2025-12-0001).
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

        // Try to locate rows by request_id first (eg. 2025-12-0001). If none found, try numeric id
        $prs = PurchaseRequest::where('request_id', $id)->get();

        if ($prs->isEmpty()) {
            if (is_numeric($id)) {
                $single = PurchaseRequest::find((int) $id);
                if (!$single)
                    return response()->json(['error' => 'Purchase request not found'], 404);
                $prs = collect([$single]);
            } else {
                return response()->json(['error' => 'Purchase request not found'], 404);
            }
        }

        $oldStatuses = $prs->pluck('status')->unique()->implode(', ');
        $updatedCount = 0;
        foreach ($prs as $pr) {
            $pr->status = $data['status'];
            $pr->save();
            $updatedCount++;
        }

        // Optionally log activity
        try {
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties(['request_id' => $id, 'updated_rows' => $updatedCount])
                ->log(sprintf('Purchase request %s status changed from %s to %s (updated %d rows)', $id, $oldStatuses, $data['status'], $updatedCount));
        } catch (\Exception $e) {
            // ignore logging failures
        }

        return response()->json(['updated' => $updatedCount, 'status' => $data['status']]);
    }

    /**
     * Store multiple purchase request items as a batch.
     * Each item will be persisted as a separate PurchaseRequest row sharing
     * the same generated request_id so they can be grouped in the UI.
     */
    public function batchStore(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'requester' => 'required|string',
            'designation' => 'nullable|string',
            'department' => 'required|string',
            'purpose' => 'nullable|string',
            'neededDate' => 'nullable|date|after_or_equal:today',
            'priority' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_description' => 'required|string',
            'items.*.unit' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.total_cost' => 'nullable|numeric|min:0',
        ]);

        // Generate single request_id for the whole batch so multiple items share the same Request ID
        $idGenerator = new PurchaseRequestIdGenerator();

        $batchRequestId = $idGenerator->nextBaseForPeriod();

        $createdRecords = [];
        $fallbackToPerItem = false;

        // First attempt: try to create all rows sharing the same batchRequestId. If the DB still has
        // a unique constraint on request_id, this will fail; in that case we fall back to creating
        // per-item request_ids (backwards-compatible behavior).
        try {
            DB::transaction(function () use ($data, $batchRequestId, &$createdRecords) {
                foreach ($data['items'] as $item) {
                    $qty = (int) ($item['quantity'] ?? 0);
                    $unitCost = isset($item['unit_cost']) ? (float) $item['unit_cost'] : (isset($item['unitCost']) ? (float) $item['unitCost'] : null);
                    $lineTotal = isset($item['total_cost']) ? (float) $item['total_cost'] : ($unitCost !== null ? $qty * $unitCost : null);

                    $created = PurchaseRequest::create([
                        'request_id' => $batchRequestId,
                        'email' => $data['email'],
                        'requester' => $data['requester'],
                        'designation' => $data['designation'] ?? null,
                        'department' => $data['department'],
                        'items' => null, // record individual line items on separate rows
                        'item_description' => $item['item_description'],
                        'unit' => $item['unit'] ?? null,
                        'quantity' => $qty,
                        'unit_cost' => $unitCost,
                        'total_cost' => $lineTotal,
                        'purpose' => $data['purpose'] ?? null,
                        'needed_date' => $data['neededDate'] ?? null,
                        'priority' => $data['priority'] ?? 'Low',
                        'status' => 'Incoming',
                        'submitted_at' => now(),
                        'metadata' => ['batch' => true],
                    ]);
                    $createdRecords[] = $created;
                }
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // If the failure is due to a duplicate key on request_id (unique index still present),
            // fallback to per-item request ids. Otherwise rethrow.
            $message = $e->getMessage();
            if (stripos($message, 'duplicate') !== false || stripos($message, 'unique') !== false || stripos($message, 'request_id') !== false) {
                $fallbackToPerItem = true;
                $createdRecords = [];
                // Secondary approach: create each item with its own generated request id
                DB::transaction(function () use ($data, $idGenerator, &$createdRecords) {
                    foreach ($data['items'] as $item) {
                        $perItemRequestId = $idGenerator->nextBaseForPeriod();
                        $qty = (int) ($item['quantity'] ?? 0);
                        $unitCost = isset($item['unit_cost']) ? (float) $item['unit_cost'] : (isset($item['unitCost']) ? (float) $item['unitCost'] : null);
                        $lineTotal = isset($item['total_cost']) ? (float) $item['total_cost'] : ($unitCost !== null ? $qty * $unitCost : null);

                        $created = PurchaseRequest::create([
                            'request_id' => $perItemRequestId,
                            'email' => $data['email'],
                            'requester' => $data['requester'],
                            'designation' => $data['designation'] ?? null,
                            'department' => $data['department'],
                            'items' => null,
                            'item_description' => $item['item_description'],
                            'unit' => $item['unit'] ?? null,
                            'quantity' => $qty,
                            'unit_cost' => $unitCost,
                            'total_cost' => $lineTotal,
                            'purpose' => $data['purpose'] ?? null,
                            'needed_date' => $data['neededDate'] ?? null,
                            'priority' => $data['priority'] ?? 'Low',
                            'status' => 'Incoming',
                            'submitted_at' => now(),
                            'metadata' => ['batch' => true],
                        ]);
                        $createdRecords[] = $created;
                    }
                });
            } else {
                throw $e;
            }
        }

        $results = ['data' => $createdRecords, 'request_id' => $fallbackToPerItem ? null : $batchRequestId, 'batch_items' => $createdRecords, 'failed' => [], 'fallback' => $fallbackToPerItem];

        // Try to send notification email to requester and admins (best-effort)
        $emailSent = false;
        if (!empty($createdRecords)) {
            try {
                $admins = \App\Models\User::whereHas('roles', function ($q) {
                    $q->whereIn('name', ['System Admin', 'Administrator']);
                })->pluck('email')->filter()->toArray();

                \Illuminate\Support\Facades\Log::info('Attempting to send batch purchase request submitted email', ['requester' => $createdRecords[0]->email, 'admins' => $admins, 'request_id' => $batchRequestId]);

                // Send email using the first record as representative; mail class accepts the batch collection
                if (filled($createdRecords[0]->email)) {
                    \Illuminate\Support\Facades\Mail::to($createdRecords[0]->email)->send(new \App\Mail\PurchaseRequestSubmitted($createdRecords[0], collect($createdRecords)));
                    \Illuminate\Support\Facades\Log::info('Batch purchase request email sent to requester', ['to' => $createdRecords[0]->email, 'request_id' => $batchRequestId]);
                } else {
                    \Illuminate\Support\Facades\Log::warning('No requester email for batch; skipping requester notification', ['request_id' => $batchRequestId]);
                }

                if (!empty($admins)) {
                    \Illuminate\Support\Facades\Mail::to($admins)->send(new \App\Mail\PurchaseRequestSubmitted($createdRecords[0], collect($createdRecords)));
                    \Illuminate\Support\Facades\Log::info('Batch purchase request email sent to admins', ['admins' => $admins, 'request_id' => $batchRequestId]);
                }

                $emailSent = true;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed sending batch purchase request email: ' . $e->getMessage());
                $emailSent = false;
            }
        }

        $results['email_sent'] = $emailSent;
        // Return the normalized results (contains batch_items, request_id (or null if fallback), and fallback flag)
        return response()->json($results, 201);
    }
}
