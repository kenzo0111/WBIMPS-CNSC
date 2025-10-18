<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(['data' => Category::all()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        // Generate a new category code like C001 if not provided
        if (empty($request->input('code'))) {
            $last = Category::whereNotNull('code')
                ->orderByRaw("CAST(SUBSTRING(code, 2) AS UNSIGNED) DESC")
                ->first();

            $next = 1;
            if ($last && preg_match('/C(\d+)/', $last->code, $m)) {
                $next = intval($m[1]) + 1;
            }

            $validated['code'] = sprintf('C%03d', $next);
        }

        $category = Category::create($validated);
        return response()->json(['data' => $category], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
        return response()->json(['data' => $category]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update($validated);
        return response()->json(['data' => $category]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(['message' => 'Category deleted']);
    }
}
