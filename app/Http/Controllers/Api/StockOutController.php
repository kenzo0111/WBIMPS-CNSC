<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\StockOut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            'issue_id' => 'required|string|unique:stock_out,issue_id',
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
            'date_issued' => 'required|date',
        ]);

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
            'issue_id' => 'required|string|unique:stock_out,issue_id,' . $stockOut->getKey(),
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
        });

        return response()->json(['data' => $stockOut->fresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StockOut $stockOut)
    {
        DB::transaction(function () use ($stockOut) {
            // Restore to item inventory
            $item = Item::where('sku', $stockOut->sku)->first();
            if ($item) {
                $item->increment('quantity', $stockOut->quantity);
            }

            $stockOut->delete();
        });

        return response()->json(['message' => 'Stock out record deleted']);
    }
}
