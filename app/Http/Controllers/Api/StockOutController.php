<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\StockOut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StockOutController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = StockOut::query();

        if ($request->has('sku')) {
            $query->where('sku', $request->sku);
        }

        if ($request->has('date_from')) {
            $query->where('date_issued', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date_issued', '<=', $request->date_to);
        }

        $query->orderBy('date_issued', 'desc');

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Accept alternate client field names for backward compatibility
        if (!$request->has('product_name') && $request->has('Item_name')) {
            $request->merge(['product_name' => $request->input('Item_name')]);
        }
        if (!$request->has('product_name') && $request->has('ItemName')) {
            $request->merge(['product_name' => $request->input('ItemName')]);
        }
        $validated = $request->validate([
            'issue_id' => 'nullable|string',
            'transaction_id' => 'nullable|string|unique:stock_out',
            'sku' => 'required|string|exists:items,sku',
            'product_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'total_cost' => 'nullable|numeric|min:0',
            'department' => 'nullable|string',
            'issued_to' => 'nullable|string',
            'issued_by' => 'nullable|string',
            'purpose' => 'nullable|string',
            'fund_cluster' => 'nullable|string',
            'responsibility_center_code' => 'nullable|string',
            'date_issued' => 'required|date',
        ]);

        // Generate or adjust issue_id
        if (!empty($validated['issue_id'])) {
            if (StockOut::where('issue_id', $validated['issue_id'])->exists()) {
                // Issue ID already exists, generate a new one
                $year = date('Y');
                $month = date('m');
                $lastIssue = StockOut::where('issue_id', 'like', "{$year}-{$month}-%")
                    ->orderByRaw('CAST(SUBSTRING_INDEX(issue_id, "-", -1) AS UNSIGNED) DESC')
                    ->first();
                $nextNumber = $lastIssue ? (intval(substr($lastIssue->issue_id, -4)) + 1) : 1;
                $validated['issue_id'] = sprintf('%s-%s-%04d', $year, $month, $nextNumber);
            }
        } else {
            // Generate issue_id if not provided
            $year = date('Y');
            $month = date('m');
            $lastIssue = StockOut::where('issue_id', 'like', "{$year}-{$month}-%")
                ->orderByRaw('CAST(SUBSTRING_INDEX(issue_id, "-", -1) AS UNSIGNED) DESC')
                ->first();
            $nextNumber = $lastIssue ? (intval(substr($lastIssue->issue_id, -4)) + 1) : 1;
            $validated['issue_id'] = sprintf('%s-%s-%04d', $year, $month, $nextNumber);
        }

        // Check if sufficient stock is available
        $item = Item::where('sku', $validated['sku'])->first();
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }
        if ($item->quantity < $validated['quantity']) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        // Enforce minimum remaining stock threshold: do not allow creating a stock out
        // which would leave the item with 20 units or less.
        $remaining = $item->quantity - $validated['quantity'];
        if ($remaining <= 20) {
            return response()->json([
                'error' => "Cannot create stock out: remaining stock for {$item->sku} would be {$remaining}, which is at or below the minimum allowed (20).",
            ], 422);
        }

        $created = null;
        DB::transaction(function () use ($validated, &$created) {
            // Calculate total_cost if not provided
            if (!isset($validated['total_cost']) && isset($validated['unit_cost'])) {
                $validated['total_cost'] = $validated['quantity'] * $validated['unit_cost'];
            }

            $created = StockOut::create($validated);

            // Update item inventory
            $item = Item::where('sku', $validated['sku'])->first();
            $item->decrement('quantity', $validated['quantity']);

            // Log server-side activity for Stock Out creation
            try {
                activity()->causedBy(Auth::user())
                    ->withProperties([
                        'issueId' => $created->issue_id ?? $created->id ?? null,
                        'transactionId' => $created->transaction_id ?? null,
                        'sku' => $created->sku ?? null,
                        'quantity' => $created->quantity ?? null,
                        'product_name' => $created->product_name ?? null,
                    ])
                    ->log(sprintf('Stock Out: %s', $created->product_name ?? $created->sku ?? ''));
            } catch (\Throwable $e) {
                // Ignore logging failure
            }

            return $created;
        });

        return response()->json(['data' => $created], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(StockOut $stockOut)
    {
        return response()->json(['data' => $stockOut]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, StockOut $stockOut)
    {
        // Accept alternate client field names for backward compatibility
        if (!$request->has('product_name') && $request->has('Item_name')) {
            $request->merge(['product_name' => $request->input('Item_name')]);
        }
        if (!$request->has('product_name') && $request->has('ItemName')) {
            $request->merge(['product_name' => $request->input('ItemName')]);
        }
        $validated = $request->validate([
            'issue_id' => 'required|string',
            'transaction_id' => 'nullable|string|unique:stock_out,transaction_id,' . $stockOut->getKey(),
            'sku' => 'required|string|exists:items,sku',
            'product_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'total_cost' => 'nullable|numeric|min:0',
            'department' => 'nullable|string',
            'issued_to' => 'nullable|string',
            'issued_by' => 'nullable|string',
            'purpose' => 'nullable|string',
            'date_issued' => 'required|date',
        ]);

        // Validate item(s) and ensure resulting stock after update doesn't violate minimum threshold
        $oldQuantity = $stockOut->quantity;
        $oldSku = $stockOut->sku;

        $newSku = $validated['sku'];
        $newItem = Item::where('sku', $newSku)->first();
        if (!$newItem) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        if ($oldSku === $newSku) {
            // Same SKU: item currently reflects stock after original issuance, so restore old qty then apply new qty
            $currentItem = $newItem; // same item
            $newRemaining = $currentItem->quantity + $oldQuantity - $validated['quantity'];
            if ($newRemaining < 0) {
                return response()->json(['error' => 'Insufficient stock'], 400);
            }
            if ($newRemaining <= 20) {
                return response()->json([
                    'error' => "Cannot update stock out: resulting remaining stock for {$currentItem->sku} would be {$newRemaining}, which is at or below the minimum allowed (20).",
                ], 422);
            }
        } else {
            // SKU changed: check new item availability after applying requested quantity
            if ($newItem->quantity < $validated['quantity']) {
                return response()->json(['error' => 'Insufficient stock for target item'], 400);
            }
            $newRemaining = $newItem->quantity - $validated['quantity'];
            if ($newRemaining <= 20) {
                return response()->json([
                    'error' => "Cannot update stock out: resulting remaining stock for {$newItem->sku} would be {$newRemaining}, which is at or below the minimum allowed (20).",
                ], 422);
            }
        }

        DB::transaction(function () use ($validated, $stockOut) {
            $oldQuantity = $stockOut->quantity;
            $oldSku = $stockOut->sku;

            $stockOut->update($validated);

            // Update item inventory
            if ($oldSku !== $validated['sku']) {
                // SKU changed, adjust both old and new items
                $oldItem = Item::where('sku', $oldSku)->first();
                if ($oldItem) {
                    $oldItem->increment('quantity', $oldQuantity);
                }

                $newItem = Item::where('sku', $validated['sku'])->first();
                if ($newItem) {
                    $newItem->decrement('quantity', $validated['quantity']);
                }
            } else {
                // Same SKU, adjust quantity difference
                $quantityDiff = $validated['quantity'] - $oldQuantity;
                $item = Item::where('sku', $validated['sku'])->first();
                if ($item) {
                    $item->decrement('quantity', $quantityDiff);
                }
            }

            // Log activity for update
            try {
                activity()->causedBy(Auth::user())
                    ->withProperties([
                        'issueId' => $stockOut->issue_id ?? $stockOut->id ?? null,
                        'transactionId' => $stockOut->transaction_id ?? null,
                        'sku' => $stockOut->sku ?? null,
                        'quantity' => $stockOut->quantity ?? null,
                        'product_name' => $stockOut->product_name ?? null,
                    ])
                    ->log(sprintf('Stock Out Updated: %s', $stockOut->product_name ?? $stockOut->sku ?? ''));
            } catch (\Throwable $e) {
            }
        });

        return response()->json(['data' => $stockOut->fresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StockOut $stockOut)
    {
        DB::transaction(function () use ($stockOut) {
            // Restore to item inventory (if item exists)
            $item = Item::where('sku', $stockOut->sku)->first();
            if ($item) {
                $item->increment('quantity', $stockOut->quantity);
            }

            // Log activity for deletion (always attempt logging)
            try {
                activity()->causedBy(Auth::user())
                    ->withProperties([
                        'issueId' => $stockOut->issue_id ?? $stockOut->id ?? null,
                        'transactionId' => $stockOut->transaction_id ?? null,
                        'sku' => $stockOut->sku ?? null,
                        'quantity' => $stockOut->quantity ?? null,
                        'product_name' => $stockOut->product_name ?? null,
                    ])
                    ->log(sprintf('Stock Out deleted: %s', $stockOut->product_name ?? $stockOut->sku ?? ''));
            } catch (\Throwable $e) {
            }

            $stockOut->delete();
        });

        return response()->json(['message' => 'Stock out record deleted']);
    }

    /**
     * Submit multiple stock-out items as a batch transaction.
     * This endpoint accepts an array of items and processes them together,
     * sharing the same batch ID for correlation.
     */
    public function batchStore(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.issue_id' => 'nullable|string',
            'items.*.transaction_id' => 'nullable|string',
            'items.*.sku' => 'required|string|exists:items,sku',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.total_cost' => 'nullable|numeric|min:0',
            'items.*.department' => 'nullable|string',
            'items.*.issued_to' => 'nullable|string',
            'items.*.issued_by' => 'nullable|string',
            'items.*.purpose' => 'nullable|string',
            'items.*.fund_cluster' => 'nullable|string',
            'items.*.responsibility_center_code' => 'nullable|string',
            'items.*.date_issued' => 'required|date',
        ]);

        // Generate a new unique issue_id for the batch
        $year = date('Y');
        $month = date('m');
        $lastIssue = StockOut::where('issue_id', 'like', "{$year}-{$month}-%")
            ->orderByRaw('CAST(SUBSTRING_INDEX(issue_id, "-", -1) AS UNSIGNED) DESC')
            ->first();
        $nextNumber = $lastIssue ? (intval(substr($lastIssue->issue_id, -4)) + 1) : 1;
        $issueId = sprintf('%s-%s-%04d', $year, $month, $nextNumber);

        // Assign the same issue_id to all items
        foreach ($validated['items'] as &$itemData) {
            $itemData['issue_id'] = $issueId;
        }

        $results = [
            'successful' => [],
            'failed' => [],
            'batchId' => $request->input('batchId'),
        ];

        DB::transaction(function () use ($validated, &$results) {
            foreach ($validated['items'] as $itemData) {
                try {
                    // Check stock availability for each item
                    $item = Item::where('sku', $itemData['sku'])->first();
                    if (!$item) {
                        $results['failed'][] = [
                            'sku' => $itemData['sku'],
                            'error' => 'Item not found',
                        ];
                        continue;
                    }

                    if ($item->quantity < $itemData['quantity']) {
                        $results['failed'][] = [
                            'sku' => $itemData['sku'],
                            'error' => 'Insufficient stock',
                        ];
                        continue;
                    }

                    $remaining = $item->quantity - $itemData['quantity'];
                    if ($remaining <= 20) {
                        $results['failed'][] = [
                            'sku' => $itemData['sku'],
                            'error' => "Cannot create stock out: remaining stock would be {$remaining}, which is at or below minimum (20).",
                        ];
                        continue;
                    }

                    // Create stock-out record
                    $stockOut = StockOut::create($itemData);

                    // Update item inventory
                    $item->decrement('quantity', $itemData['quantity']);

                    // Log activity
                    try {
                        activity()->causedBy(Auth::user())
                            ->withProperties([
                                'issueId' => $stockOut->issue_id ?? $stockOut->id ?? null,
                                'transactionId' => $stockOut->transaction_id ?? null,
                                'sku' => $stockOut->sku ?? null,
                                'quantity' => $stockOut->quantity ?? null,
                                'product_name' => $stockOut->product_name ?? null,
                            ])
                            ->log(sprintf('Stock Out (Batch): %s', $stockOut->product_name ?? $stockOut->sku ?? ''));
                    } catch (\Throwable $e) {
                    }

                    $results['successful'][] = [
                        'id' => $stockOut->id,
                        'sku' => $stockOut->sku,
                        'quantity' => $stockOut->quantity,
                    ];
                } catch (\Throwable $e) {
                    $results['failed'][] = [
                        'sku' => $itemData['sku'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ];
                }
            }
        });

        $httpStatus = empty($results['failed']) ? 201 : 207; // 207 Multi-Status for partial success
        return response()->json($results, $httpStatus);
    }
}
