<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        // Get the category to apply category-specific validation
        $category = null;
        // Use a safe check when reading optional category_id to avoid undefined array key errors
        if (!empty($validated['category_id'])) {
            $category = Category::find($validated['category_id']);
        }

        // Category-specific validation
        if ($category) {
            $categoryName = strtolower($category->name);

            if (str_contains($categoryName, 'non-expendable')) {
                // Non-expendable items require description and unit
                $request->validate([
                    'description' => 'required|string|min:10',
                    'unit' => 'required|string|max:50',
                    'unit_cost' => 'required|numeric|min:50000',
                ]);
            } elseif (str_contains($categoryName, 'semi-expendable')) {
                // Semi-expendable items require unit and description
                $request->validate([
                    'unit' => 'required|string|max:50',
                    'description' => 'required|string|min:5',
                ]);
            } elseif (str_contains($categoryName, 'expendable')) {
                // Expendable items require unit
                $request->validate([
                    'unit' => 'required|string|max:50',
                ]);
            }
        }

        $item = Item::create($validated);

        // Log activity: Item created
        try {
            activity()->causedBy(Auth::user())
                ->withProperties([
                    'sku' => $item->sku ?? null,
                    'name' => $item->name ?? null,
                    'category_id' => $item->category_id ?? null,
                ])
                ->log(sprintf('Item Created: %s', $item->name ?? $item->sku ?? ''));
        } catch (\Throwable $e) {
        }

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

        // Get the category to apply category-specific validation
        $category = null;
        // Use a safe check when reading optional category_id to avoid undefined array key errors
        if (!empty($validated['category_id'])) {
            $category = Category::find($validated['category_id']);
        }

        // Category-specific validation
        if ($category) {
            $categoryName = strtolower($category->name);

            if (str_contains($categoryName, 'non-expendable')) {
                // Non-expendable items require description and unit
                $request->validate([
                    'description' => 'required|string|min:10',
                    'unit' => 'required|string|max:50',
                    'unit_cost' => 'required|numeric|min:50000',
                ]);
            } elseif (str_contains($categoryName, 'semi-expendable')) {
                // Semi-expendable items require unit and description
                $request->validate([
                    'unit' => 'required|string|max:50',
                    'description' => 'required|string|min:5',
                ]);
            } elseif (str_contains($categoryName, 'expendable')) {
                // Expendable items require unit
                $request->validate([
                    'unit' => 'required|string|max:50',
                ]);
            }
        }

        $item->update($validated);

        // Log activity: Item updated
        try {
            activity()->causedBy(Auth::user())
                ->withProperties([
                    'sku' => $item->sku ?? null,
                    'name' => $item->name ?? null,
                    'category_id' => $item->category_id ?? null,
                ])
                ->log(sprintf('Item Updated: %s', $item->name ?? $item->sku ?? ''));
        } catch (\Throwable $e) {
        }

        return response()->json(['data' => $item->load('category')]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item)
    {
        // Log activity: Item deleted
        try {
            activity()->causedBy(Auth::user())
                ->withProperties([
                    'sku' => $item->sku ?? null,
                    'name' => $item->name ?? null,
                    'category_id' => $item->category_id ?? null,
                ])
                ->log(sprintf('Item Deleted: %s', $item->name ?? $item->sku ?? ''));
        } catch (\Throwable $e) {
        }

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
