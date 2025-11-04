<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of purchase orders.
     */
    public function index()
    {
        $purchaseOrders = PurchaseOrder::orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $purchaseOrders
        ]);
    }

    /**
     * Store a newly created purchase order in storage.
     */
    public function store(Request $request)
    {
        // Log the incoming request for debugging
        \Log::info('Purchase Order Store Request', ['data' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'po_number' => 'required|string|unique:purchase_orders,po_number',
            'supplier' => 'nullable|string|max:255',
            'supplier_address' => 'nullable|string',
            'tin_number' => 'nullable|string|max:50',
            'date_of_purchase' => 'nullable|date',
            'mode_of_procurement' => 'nullable|string|max:255',
            'place_of_delivery' => 'nullable|string',
            'delivery_term' => 'nullable|string',
            'date_of_delivery' => 'nullable|string',
            'payment_term' => 'nullable|string',
            'items' => 'nullable|array',
            'grand_total' => 'nullable|numeric|min:0',
            'fund_cluster' => 'nullable|string',
            'ors_burs_no' => 'nullable|string',
            'funds_available' => 'nullable|string',
            'ors_burs_date' => 'nullable|date',
            'ors_burs_amount' => 'nullable|numeric|min:0',
            'entity_name' => 'nullable|string',
            'entity_address' => 'nullable|string',
            'department' => 'nullable|string',
            'gentlemen' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'nullable|string|in:draft,submitted,pending,approved,delivered,completed,cancelled',
        ]);

        if ($validator->fails()) {
            \Log::error('Purchase Order Validation Failed', [
                'errors' => $validator->errors()->toArray(),
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        
        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'submitted';
        }

        // Set default entity info if not provided
        if (!isset($data['entity_name'])) {
            $data['entity_name'] = 'Camarines Norte State College';
        }

        $purchaseOrder = PurchaseOrder::create($data);

        // Log activity
        try {
            \App\Models\Activity::create([
                'action' => 'Purchase Order Created',
                'meta' => json_encode([
                    'po_number' => $purchaseOrder->po_number,
                    'supplier' => $purchaseOrder->supplier,
                    'total' => $purchaseOrder->grand_total
                ])
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to log purchase order creation activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase order created successfully',
            'data' => $purchaseOrder
        ], 201);
    }

    /**
     * Display the specified purchase order.
     */
    public function show($id)
    {
        $purchaseOrder = PurchaseOrder::find($id);

        if (!$purchaseOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Update the specified purchase order in storage.
     */
    public function update(Request $request, $id)
    {
        $purchaseOrder = PurchaseOrder::find($id);

        if (!$purchaseOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'po_number' => 'sometimes|string|unique:purchase_orders,po_number,' . $id,
            'supplier' => 'sometimes|string|max:255',
            'supplier_address' => 'nullable|string',
            'tin_number' => 'nullable|string|max:50',
            'date_of_purchase' => 'nullable|date',
            'mode_of_procurement' => 'nullable|string|max:255',
            'place_of_delivery' => 'nullable|string',
            'delivery_term' => 'nullable|string',
            'date_of_delivery' => 'nullable|string',
            'payment_term' => 'nullable|string',
            'items' => 'nullable|array',
            'grand_total' => 'nullable|numeric|min:0',
            'fund_cluster' => 'nullable|string',
            'ors_burs_no' => 'nullable|string',
            'funds_available' => 'nullable|string',
            'ors_burs_date' => 'nullable|date',
            'ors_burs_amount' => 'nullable|numeric|min:0',
            'entity_name' => 'nullable|string',
            'entity_address' => 'nullable|string',
            'status' => 'nullable|string|in:draft,submitted,pending,approved,delivered,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $purchaseOrder->update($request->all());

        // Log activity
        try {
            \App\Models\Activity::create([
                'action' => 'Purchase Order Updated',
                'meta' => json_encode([
                    'po_number' => $purchaseOrder->po_number,
                    'supplier' => $purchaseOrder->supplier
                ])
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to log purchase order update activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase order updated successfully',
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Remove the specified purchase order from storage.
     */
    public function destroy($id)
    {
        $purchaseOrder = PurchaseOrder::find($id);

        if (!$purchaseOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found'
            ], 404);
        }

        $poNumber = $purchaseOrder->po_number;
        $purchaseOrder->delete();

        // Log activity
        try {
            \App\Models\Activity::create([
                'action' => 'Purchase Order Deleted',
                'meta' => json_encode(['po_number' => $poNumber])
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to log purchase order deletion activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase order deleted successfully'
        ]);
    }

    /**
     * Update the status of a purchase order.
     */
    public function updateStatus(Request $request, $id)
    {
        $purchaseOrder = PurchaseOrder::find($id);

        if (!$purchaseOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:draft,submitted,pending,approved,delivered,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldStatus = $purchaseOrder->status;
        $purchaseOrder->status = $request->status;
        $purchaseOrder->save();

        // Log activity
        try {
            \App\Models\Activity::create([
                'action' => 'Purchase Order Status Updated',
                'meta' => json_encode([
                    'po_number' => $purchaseOrder->po_number,
                    'old_status' => $oldStatus,
                    'new_status' => $request->status
                ])
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to log purchase order status update activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase order status updated successfully',
            'data' => $purchaseOrder
        ]);
    }
}
