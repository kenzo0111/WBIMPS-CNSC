<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockIn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockInController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = StockIn::query();

        if ($request->has('sku')) {
            $query->where('sku', $request->sku);
        }

        if ($request->has('date_from')) {
            $query->where('date_received', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date_received', '<=', $request->date_to);
        }

        $query->orderBy('date_received', 'desc');

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_id' => 'required|string|unique:stock_in',
            'sku' => 'required|string|exists:products,sku',
            'product_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'numeric|min:0',
            'supplier' => 'nullable|string',
            'date_received' => 'required|date',
            'received_by' => 'nullable|string',
        ]);

        $created = null;
        DB::transaction(function () use ($validated, &$created) {
            $created = StockIn::create($validated);

            // Update product inventory
            $product = Product::where('sku', $validated['sku'])->first();
            if ($product) {
                $product->increment('quantity', $validated['quantity']);
                $product->unit_cost = $validated['unit_cost'];
                $product->save();
            }

            return $created;
        });

        return response()->json(['data' => $created], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(StockIn $stockIn)
    {
        return response()->json(['data' => $stockIn]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, StockIn $stockIn)
    {
        $validated = $request->validate([
            'transaction_id' => 'required|string|unique:stock_in,transaction_id,' . $stockIn->id,
            'sku' => 'required|string|exists:products,sku',
            'product_name' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'numeric|min:0',
            'supplier' => 'nullable|string',
            'date_received' => 'required|date',
            'received_by' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $stockIn) {
            $oldQuantity = $stockIn->quantity;
            $oldSku = $stockIn->sku;

            $stockIn->update($validated);

            // Update product inventory
            if ($oldSku !== $validated['sku']) {
                // SKU changed, adjust both old and new products
                $oldProduct = Product::where('sku', $oldSku)->first();
                if ($oldProduct) {
                    $oldProduct->decrement('quantity', $oldQuantity);
                }

                $newProduct = Product::where('sku', $validated['sku'])->first();
                if ($newProduct) {
                    $newProduct->increment('quantity', $validated['quantity']);
                    $newProduct->unit_cost = $validated['unit_cost'];
                    $newProduct->save();
                }
            } else {
                // Same SKU, adjust quantity difference
                $quantityDiff = $validated['quantity'] - $oldQuantity;
                $product = Product::where('sku', $validated['sku'])->first();
                if ($product) {
                    $product->increment('quantity', $quantityDiff);
                    $product->unit_cost = $validated['unit_cost'];
                    $product->save();
                }
            }
        });

        return response()->json(['data' => $stockIn->fresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StockIn $stockIn)
    {
        DB::transaction(function () use ($stockIn) {
            // Remove from product inventory
            $product = Product::where('sku', $stockIn->sku)->first();
            if ($product) {
                $product->decrement('quantity', $stockIn->quantity);
            }

            $stockIn->delete();
        });

        return response()->json(['message' => 'Stock in record deleted']);
    }
}
