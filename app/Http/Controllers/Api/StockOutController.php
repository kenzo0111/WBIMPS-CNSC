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
            'transaction_id' => 'required|string|unique:stock_out',
            'sku' => 'required|string|exists:products,sku',
            'product_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'recipient' => 'nullable|string',
            'purpose' => 'nullable|string',
            'date_issued' => 'required|date',
        ]);

        // Check if sufficient stock is available
        $product = Product::where('sku', $validated['sku'])->first();
        if (!$product || $product->quantity < $validated['quantity']) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        DB::transaction(function () use ($validated) {
            $stockOut = StockOut::create($validated);

            // Update product inventory
            $product = Product::where('sku', $validated['sku'])->first();
            $product->decrement('quantity', $validated['quantity']);

            return $stockOut;
        });

        return response()->json(['data' => StockOut::find($validated['transaction_id'])], 201);
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
            'transaction_id' => 'required|string|unique:stock_out,transaction_id,' . $stockOut->id,
            'sku' => 'required|string|exists:products,sku',
            'product_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'recipient' => 'nullable|string',
            'purpose' => 'nullable|string',
            'date_issued' => 'required|date',
        ]);

        // Check if sufficient stock is available
        $product = Product::where('sku', $validated['sku'])->first();
        $availableStock = $product ? $product->quantity + $stockOut->quantity : 0;
        if ($availableStock < $validated['quantity']) {
            return response()->json(['error' => 'Insufficient stock'], 400);
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
