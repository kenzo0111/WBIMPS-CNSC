<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
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
        $validated = $request->validate([
            'issue_id' => 'required|string|unique:stock_out,issue_id',
            'transaction_id' => 'nullable|string|unique:stock_out',
            'sku' => 'required|string|exists:products,sku',
            'product_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'total_cost' => 'nullable|numeric|min:0',
            'department' => 'nullable|string',
            'issued_to' => 'nullable|string',
            'issued_by' => 'nullable|string',
            'purpose' => 'nullable|string',
            'status' => 'nullable|string',
            'date_issued' => 'required|date',
        ]);

        // Check if sufficient stock is available
        $product = Product::where('sku', $validated['sku'])->first();
        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }
        if ($product->quantity < $validated['quantity']) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        // Enforce minimum remaining stock threshold: do not allow creating a stock out
        // which would leave the product with 20 units or less.
        $remaining = $product->quantity - $validated['quantity'];
        if ($remaining <= 20) {
            return response()->json([
                'error' => "Cannot create stock out: remaining stock for {$product->sku} would be {$remaining}, which is at or below the minimum allowed (20)."
            ], 422);
        }

        $created = null;
        DB::transaction(function () use ($validated, &$created) {
            $created = StockOut::create($validated);

            // Update product inventory
            $product = Product::where('sku', $validated['sku'])->first();
            $product->decrement('quantity', $validated['quantity']);

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
        $validated = $request->validate([
            'issue_id' => 'required|string|unique:stock_out,issue_id,' . $stockOut->id,
            'transaction_id' => 'nullable|string|unique:stock_out,transaction_id,' . $stockOut->id,
            'sku' => 'required|string|exists:products,sku',
            'product_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'total_cost' => 'nullable|numeric|min:0',
            'department' => 'nullable|string',
            'issued_to' => 'nullable|string',
            'issued_by' => 'nullable|string',
            'purpose' => 'nullable|string',
            'status' => 'nullable|string',
            'date_issued' => 'required|date',
        ]);

        // Validate product(s) and ensure resulting stock after update doesn't violate minimum threshold
        $oldQuantity = $stockOut->quantity;
        $oldSku = $stockOut->sku;

        $newSku = $validated['sku'];
        $newProduct = Product::where('sku', $newSku)->first();
        if (!$newProduct) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        if ($oldSku === $newSku) {
            // Same SKU: product currently reflects stock after original issuance, so restore old qty then apply new qty
            $currentProduct = $newProduct; // same product
            $newRemaining = $currentProduct->quantity + $oldQuantity - $validated['quantity'];
            if ($newRemaining < 0) {
                return response()->json(['error' => 'Insufficient stock'], 400);
            }
            if ($newRemaining <= 20) {
                return response()->json([
                    'error' => "Cannot update stock out: resulting remaining stock for {$currentProduct->sku} would be {$newRemaining}, which is at or below the minimum allowed (20)."
                ], 422);
            }
        } else {
            // SKU changed: check new product availability after applying requested quantity
            if ($newProduct->quantity < $validated['quantity']) {
                return response()->json(['error' => 'Insufficient stock for target product'], 400);
            }
            $newRemaining = $newProduct->quantity - $validated['quantity'];
            if ($newRemaining <= 20) {
                return response()->json([
                    'error' => "Cannot update stock out: resulting remaining stock for {$newProduct->sku} would be {$newRemaining}, which is at or below the minimum allowed (20)."
                ], 422);
            }
        }

        DB::transaction(function () use ($validated, $stockOut) {
            $oldQuantity = $stockOut->quantity;
            $oldSku = $stockOut->sku;

            $stockOut->update($validated);

            // Update product inventory
            if ($oldSku !== $validated['sku']) {
                // SKU changed, adjust both old and new products
                $oldProduct = Product::where('sku', $oldSku)->first();
                if ($oldProduct) {
                    $oldProduct->increment('quantity', $oldQuantity);
                }

                $newProduct = Product::where('sku', $validated['sku'])->first();
                if ($newProduct) {
                    $newProduct->decrement('quantity', $validated['quantity']);
                }
            } else {
                // Same SKU, adjust quantity difference
                $quantityDiff = $validated['quantity'] - $oldQuantity;
                $product = Product::where('sku', $validated['sku'])->first();
                if ($product) {
                    $product->decrement('quantity', $quantityDiff);
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
            // Restore to product inventory
            $product = Product::where('sku', $stockOut->sku)->first();
            if ($product) {
                $product->increment('quantity', $stockOut->quantity);
            }

            $stockOut->delete();
        });

        return response()->json(['message' => 'Stock out record deleted']);
    }
}
