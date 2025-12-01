<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('tin', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $suppliers = $query->orderBy('name')->paginate(50);

        return SupplierResource::collection($suppliers)->additional(['success' => true]);
    }

    public function store(StoreSupplierRequest $request)
    {
        $data = $request->validated();

        // normalize contact to digits only (strip any non-digit characters)
        if (!empty($data['contact'])) {
            $data['contact'] = preg_replace('/\D/', '', $data['contact']);
        }

        $supplier = Supplier::create($data);

        return (new SupplierResource($supplier))->additional(['success' => true]);
    }

    public function show($id)
    {
        $supplier = Supplier::findOrFail($id);

        return (new SupplierResource($supplier))->additional(['success' => true]);
    }

    public function update(UpdateSupplierRequest $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $data = $request->validated();

        if (!empty($data['contact'])) {
            $data['contact'] = preg_replace('/\D/', '', $data['contact']);
        }

        $supplier->update($data);

        return (new SupplierResource($supplier))->additional(['success' => true]);
    }

    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supplier deleted successfully',
        ]);
    }
}

