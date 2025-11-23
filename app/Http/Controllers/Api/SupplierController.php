<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $suppliers = Supplier::orderBy('name')->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            // Accept PH TIN styles: 9 or 12 digits, with optional hyphens (e.g. 123-456-789 or 123-456-789-000)
            'tin' => [
                'nullable',
                'string',
                'max:64',
                'regex:/^(\d{3}-\d{3}-\d{3}-\d{3}|\d{3}-\d{3}-\d{3}|\d{9}|\d{12})$/',
            ],
            // Contact: allow common formatting (digits, spaces, +, hyphens, parentheses)
            // We'll normalize to digits-only before saving and enforce 7-15 digits after normalization
            'contact' => [
                'nullable',
                'string',
                'max:128',
                'regex:/^[0-9+\s\-()]{7,30}$/',
            ],
            'email' => 'nullable|email|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $v->errors(),
            ], 422);
        }

        $data = $v->validated();
        // normalize contact to digits only (strip any non-digit characters)
        if (!empty($data['contact'])) {
            $normalized = preg_replace('/\D/', '', $data['contact']);
            // ensure normalized length is acceptable (7-15 digits)
            if (strlen($normalized) < 7 || strlen($normalized) > 15) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => ['contact' => ['Contact must be 7 to 15 digits after normalization.']],
                ], 422);
            }
            $data['contact'] = $normalized;
        }

        $supplier = Supplier::create($data);

        return response()->json([
            'success' => true,
            'data' => $supplier,
        ], 201);
    }

    public function show($id)
    {
        $s = Supplier::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $s,
        ]);
    }

    public function update(Request $request, $id)
    {
        $s = Supplier::findOrFail($id);
        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'tin' => [
                'nullable',
                'string',
                'max:64',
                'regex:/^(\d{3}-\d{3}-\d{3}-\d{3}|\d{3}-\d{3}-\d{3}|\d{9}|\d{12})$/',
            ],
            'contact' => [
                'nullable',
                'string',
                'max:128',
                'regex:/^[0-9+\s\-()]{7,30}$/',
            ],
            'email' => 'nullable|email|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);
        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $v->errors(),
            ], 422);
        }

        $data = $v->validated();
        if (!empty($data['contact'])) {
            $normalized = preg_replace('/\D/', '', $data['contact']);
            if (strlen($normalized) < 7 || strlen($normalized) > 15) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => ['contact' => ['Contact must be 7 to 15 digits after normalization.']],
                ], 422);
            }
            $data['contact'] = $normalized;
        }

        $s->update($data);

        return response()->json([
            'success' => true,
            'data' => $s,
        ]);
    }

    public function destroy($id)
    {
        $s = Supplier::findOrFail($id);
        $s->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supplier deleted successfully',
        ]);
    }
}
