<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Item::with('category');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%");
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('sort')) {
            $query->orderBy($request->sort, $request->get('order', 'asc'));
        } else {
            $query->orderBy('name');
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Item::class);
        $validated = $request->validate([
            'sku' => 'required|string|unique:items',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'quantity' => 'integer|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_cost' => 'numeric|min:0',
            'date' => 'nullable|date',
        ]);

        $item = Item::create($validated);

        return response()->json(['data' => $item->load('category')], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Item $item)
    {
        return response()->json(['data' => $item->load('category')]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        $this->authorize('update', $item);
        $validated = $request->validate([
            'sku' => 'required|string|unique:items,sku,' . $item->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'quantity' => 'integer|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_cost' => 'numeric|min:0',
            'date' => 'nullable|date',
        ]);

        $item->update($validated);

        return response()->json(['data' => $item->load('category')]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item)
    {
        $this->authorize('delete', $item);
        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }

    /**
     * Get items with low stock (threshold: 20 or below)
     */
    public function lowStock(Request $request)
    {
        $threshold = $request->get('threshold', 20);

        $items = Item::with('category')
            ->where('quantity', '<=', $threshold)
            ->orderBy('quantity', 'asc')
            ->get();

        return response()->json(['data' => $items]);
    }
}
