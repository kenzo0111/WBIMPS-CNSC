<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Supplier;
use Illuminate\Support\Facades\Validator;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $suppliers = Supplier::orderBy('name')->paginate(50);
        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'tin' => 'nullable|string|max:64',
            'contact' => 'nullable|string|max:128',
            'email' => 'nullable|email|max:255',
        ]);
        if ($v->fails()) return response()->json(['errors' => $v->errors()], 422);

        $supplier = Supplier::create($v->validated());
        return response()->json($supplier, 201);
    }

    public function show($id)
    {
        $s = Supplier::findOrFail($id);
        return response()->json($s);
    }

    public function update(Request $request, $id)
    {
        $s = Supplier::findOrFail($id);
        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'tin' => 'nullable|string|max:64',
            'contact' => 'nullable|string|max:128',
            'email' => 'nullable|email|max:255',
        ]);
        if ($v->fails()) return response()->json(['errors' => $v->errors()], 422);

        $s->update($v->validated());
        return response()->json($s);
    }

    public function destroy($id)
    {
        $s = Supplier::findOrFail($id);
        $s->delete();
        return response()->json(['deleted' => true]);
    }
}
