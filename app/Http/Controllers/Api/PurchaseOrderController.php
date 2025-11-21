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
            'data' => $purchaseOrders,
        ]);
    }

    /**
     * Store a newly created purchase order in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', PurchaseOrder::class);
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
            'ics_form_data' => 'nullable|array',
            'ris_form_data' => 'nullable|array',
            'par_form_data' => 'nullable|array',
            'iar_form_data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            \Log::error('Purchase Order Validation Failed', [
                'errors' => $validator->errors()->toArray(),
                'request' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->all();

        // Extract form data before creating purchase order
        $icsFormData = $data['ics_form_data'] ?? null;
        $risFormData = $data['ris_form_data'] ?? null;
        $parFormData = $data['par_form_data'] ?? null;
        $iarFormData = $data['iar_form_data'] ?? null;

        // Remove form data from purchase order data
        unset($data['ics_form_data'], $data['ris_form_data'], $data['par_form_data'], $data['iar_form_data']);

        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'submitted';
        }

        // Set default entity info if not provided
        if (!isset($data['entity_name'])) {
            $data['entity_name'] = 'Camarines Norte State College';
        }

        $purchaseOrder = PurchaseOrder::create($data);

        // Create ICS record if ICS form data is provided and items are marked for ICS
        if ($icsFormData && !empty($icsFormData['ics_no'])) {
            $this->createInventoryCustodianSlip($purchaseOrder, $icsFormData);
        }

        // Create RIS record if RIS form data is provided and items are marked for RIS
        if ($risFormData && !empty($risFormData['ris_no'])) {
            $this->createRequisitionIssueSlip($purchaseOrder, $risFormData);
        }

        // Create PAR record if PAR form data is provided and items are marked for PAR
        if ($parFormData && !empty($parFormData['par_no'])) {
            $this->createPropertyAcknowledgementReceipt($purchaseOrder, $parFormData);
        }

        // Create IAR record if IAR form data is provided and items are marked for IAR
        if ($iarFormData && !empty($iarFormData['iar_no'])) {
            $this->createInspectionAcceptanceReport($purchaseOrder, $iarFormData);
        }

        // Log activity
        try {
            \App\Models\Activity::create([
                'action' => 'Purchase Order Created',
                'meta' => json_encode([
                    'po_number' => $purchaseOrder->po_number,
                    'supplier' => $purchaseOrder->supplier,
                    'total' => $purchaseOrder->grand_total,
                ]),
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to log purchase order creation activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase order created successfully',
            'data' => $purchaseOrder,
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
                'message' => 'Purchase order not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $purchaseOrder,
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
                'message' => 'Purchase order not found',
            ], 404);
        }

        $this->authorize('update', $purchaseOrder);

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
                'errors' => $validator->errors(),
            ], 422);
        }

        $purchaseOrder->update($request->all());

        // Log activity
        try {
            \App\Models\Activity::create([
                'action' => 'Purchase Order Updated',
                'meta' => json_encode([
                    'po_number' => $purchaseOrder->po_number,
                    'supplier' => $purchaseOrder->supplier,
                ]),
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to log purchase order update activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase order updated successfully',
            'data' => $purchaseOrder,
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
                'message' => 'Purchase order not found',
            ], 404);
        }

        $this->authorize('delete', $purchaseOrder);

        $poNumber = $purchaseOrder->po_number;
        $purchaseOrder->delete();

        // Log activity
        try {
            \App\Models\Activity::create([
                'action' => 'Purchase Order Deleted',
                'meta' => json_encode(['po_number' => $poNumber]),
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to log purchase order deletion activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase order deleted successfully',
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
                'message' => 'Purchase order not found',
            ], 404);
        }

        $this->authorize('update', $purchaseOrder);

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:draft,submitted,pending,approved,delivered,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
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
                    'new_status' => $request->status,
                ]),
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to log purchase order status update activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase order status updated successfully',
            'data' => $purchaseOrder,
        ]);
    }

    /**
     * Create an Inventory Custodian Slip record from purchase order data.
     */
    protected function createInventoryCustodianSlip($purchaseOrder, $formData)
    {
        try {
            // Filter items that are marked for ICS generation
            $icsItems = collect($purchaseOrder->items)
                ->filter(function ($item) {
                    return isset($item['generateICS']) && $item['generateICS'] === true;
                })
                ->map(function ($item) {
                    return [
                        'stock_number' => $item['stockPropertyNumber'] ?? '',
                        'unit' => $item['unit'] ?? '',
                        'description' => $item['description'] ?? $item['detailedDescription'] ?? '',
                        'quantity' => $item['quantity'] ?? 0,
                        'unit_cost' => $item['unitCost'] ?? 0,
                        'amount' => $item['amount'] ?? 0,
                    ];
                })
                ->values()
                ->toArray();

            if (empty($icsItems)) {
                return null;
            }

            // Calculate grand total for ICS items
            $icsTotal = collect($icsItems)->sum('amount');

            // Create ICS record
            $ics = \App\Models\InventoryCustodianSlip::create([
                'purchase_order_id' => $purchaseOrder->id,
                'ics_no' => $formData['ics_no'],
                'entity_name' => $formData['entity_name'] ?? $purchaseOrder->entity_name,
                'fund_cluster' => $formData['fund_cluster'] ?? $purchaseOrder->fund_cluster,
                'items' => $icsItems,
                'grand_total' => $icsTotal,
                'status' => 'Active',
                'received_from_name' => $formData['received_from_name'] ?? null,
                'received_from_position' => $formData['received_from_position'] ?? null,
                'received_from_date' => !empty($formData['received_from_date']) ? $formData['received_from_date'] : null,
                'received_by_name' => $formData['received_by_name'] ?? null,
                'received_by_position' => $formData['received_by_position'] ?? null,
                'received_by_date' => !empty($formData['received_by_date']) ? $formData['received_by_date'] : null,
            ]);

            // Log activity
            \App\Models\Activity::create([
                'action' => 'Inventory Custodian Slip Created',
                'meta' => json_encode([
                    'ics_no' => $ics->ics_no,
                    'po_number' => $purchaseOrder->po_number,
                    'items_count' => count($icsItems),
                ]),
            ]);

            return $ics;
        } catch (\Throwable $e) {
            \Log::error('Failed to create ICS record', [
                'error' => $e->getMessage(),
                'po_number' => $purchaseOrder->po_number,
            ]);

            return null;
        }
    }

    /**
     * Create a Requisition and Issue Slip record from purchase order data.
     */
    protected function createRequisitionIssueSlip($purchaseOrder, $formData)
    {
        try {
            // Filter items that are marked for RIS generation
            $risItems = collect($purchaseOrder->items)
                ->filter(function ($item) {
                    return isset($item['generateRIS']) && $item['generateRIS'] === true;
                })
                ->map(function ($item) {
                    return [
                        'stock_number' => $item['stockPropertyNumber'] ?? '',
                        'unit' => $item['unit'] ?? '',
                        'description' => $item['description'] ?? $item['detailedDescription'] ?? '',
                        'quantity' => $item['quantity'] ?? 0,
                        'unit_cost' => $item['unitCost'] ?? 0,
                        'amount' => $item['amount'] ?? 0,
                    ];
                })
                ->values()
                ->toArray();

            if (empty($risItems)) {
                return null;
            }

            // Calculate grand total for RIS items
            $risTotal = collect($risItems)->sum('amount');

            // Create RIS record
            $ris = \App\Models\RequisitionIssueSlip::create([
                'ris_no' => $formData['ris_no'],
                'entity_name' => $formData['entity_name'] ?? $purchaseOrder->entity_name,
                'fund_cluster' => $formData['fund_cluster'] ?? $purchaseOrder->fund_cluster,
                'division' => $formData['division'] ?? null,
                'office' => $formData['office'] ?? null,
                'responsibility_center_code' => $formData['responsibility_center_code'] ?? null,
                'purpose' => $formData['purpose'] ?? null,
                'items' => $risItems,
                'grand_total' => $risTotal,
                'status' => 'Active',
                'requested_by_name' => $formData['requested_by_name'] ?? null,
                'requested_by_designation' => $formData['requested_by_designation'] ?? null,
                'requested_by_date' => !empty($formData['requested_by_date']) ? $formData['requested_by_date'] : null,
                'approved_by_name' => $formData['approved_by_name'] ?? null,
                'approved_by_designation' => $formData['approved_by_designation'] ?? null,
                'approved_by_date' => !empty($formData['approved_by_date']) ? $formData['approved_by_date'] : null,
                'issued_by_name' => $formData['issued_by_name'] ?? null,
                'issued_by_designation' => $formData['issued_by_designation'] ?? null,
                'issued_by_date' => !empty($formData['issued_by_date']) ? $formData['issued_by_date'] : null,
                'received_by_name' => $formData['received_by_name'] ?? null,
                'received_by_designation' => $formData['received_by_designation'] ?? null,
                'received_by_date' => !empty($formData['received_by_date']) ? $formData['received_by_date'] : null,
            ]);

            // Log activity
            \App\Models\Activity::create([
                'action' => 'Requisition and Issue Slip Created',
                'meta' => json_encode([
                    'ris_no' => $ris->ris_no,
                    'po_number' => $purchaseOrder->po_number,
                    'items_count' => count($risItems),
                ]),
            ]);

            return $ris;
        } catch (\Throwable $e) {
            \Log::error('Failed to create RIS record', [
                'error' => $e->getMessage(),
                'po_number' => $purchaseOrder->po_number,
            ]);

            return null;
        }
    }

    /**
     * Create a Property Acknowledgement Receipt record from purchase order data.
     */
    protected function createPropertyAcknowledgementReceipt($purchaseOrder, $formData)
    {
        try {
            // Filter items that are marked for PAR generation
            $parItems = collect($purchaseOrder->items)
                ->filter(function ($item) {
                    return isset($item['generatePAR']) && $item['generatePAR'] === true;
                })
                ->map(function ($item) {
                    return [
                        'stock_number' => $item['stockPropertyNumber'] ?? '',
                        'unit' => $item['unit'] ?? '',
                        'description' => $item['description'] ?? $item['detailedDescription'] ?? '',
                        'quantity' => $item['quantity'] ?? 0,
                        'unit_cost' => $item['unitCost'] ?? 0,
                        'amount' => $item['amount'] ?? 0,
                    ];
                })
                ->values()
                ->toArray();

            if (empty($parItems)) {
                return null;
            }

            // Calculate grand total for PAR items
            $parTotal = collect($parItems)->sum('amount');

            // Create PAR record
            $par = \App\Models\PropertyAcknowledgementReceipt::create([
                'purchase_order_id' => $purchaseOrder->id,
                'par_no' => $formData['par_no'],
                'entity_name' => $formData['entity_name'] ?? $purchaseOrder->entity_name,
                'fund_cluster' => $formData['fund_cluster'] ?? $purchaseOrder->fund_cluster,
                'date' => !empty($formData['date']) ? $formData['date'] : now(),
                'items' => $parItems,
                'grand_total' => $parTotal,
                'received_by_name' => $formData['received_by_name'] ?? null,
                'received_by_position' => $formData['received_by_position'] ?? null,
                'received_date' => !empty($formData['received_by_date']) ? $formData['received_by_date'] : null,
                'issued_by_name' => $formData['received_from_name'] ?? null,
                'issued_by_position' => $formData['received_from_position'] ?? null,
                'issued_date' => !empty($formData['received_from_date']) ? $formData['received_from_date'] : null,
                'status' => 'Active',
            ]);

            // Log activity
            \App\Models\Activity::create([
                'action' => 'Property Acknowledgement Receipt Created',
                'meta' => json_encode([
                    'par_no' => $par->par_no,
                    'po_number' => $purchaseOrder->po_number,
                    'items_count' => count($parItems),
                ]),
            ]);

            return $par;
        } catch (\Throwable $e) {
            \Log::error('Failed to create PAR record', [
                'error' => $e->getMessage(),
                'po_number' => $purchaseOrder->po_number,
            ]);

            return null;
        }
    }

    /**
     * Create an Inspection and Acceptance Report record from purchase order data.
     */
    protected function createInspectionAcceptanceReport($purchaseOrder, $formData)
    {
        try {
            // Filter items that are marked for IAR generation
            $iarItems = collect($purchaseOrder->items)
                ->filter(function ($item) {
                    return isset($item['generateIAR']) && $item['generateIAR'] === true;
                })
                ->map(function ($item) {
                    return [
                        'stock_number' => $item['stockPropertyNumber'] ?? '',
                        'unit' => $item['unit'] ?? '',
                        'description' => $item['description'] ?? $item['detailedDescription'] ?? '',
                        'quantity' => $item['quantity'] ?? 0,
                        'unit_cost' => $item['unitCost'] ?? 0,
                        'amount' => $item['amount'] ?? 0,
                    ];
                })
                ->values()
                ->toArray();

            if (empty($iarItems)) {
                return null;
            }

            // Calculate grand total for IAR items
            $iarTotal = collect($iarItems)->sum('amount');

            // Create IAR record
            $iar = \App\Models\InspectionAcceptanceReport::create([
                'purchase_order_id' => $purchaseOrder->id,
                'iar_no' => $formData['iar_no'],
                'entity_name' => $formData['entity_name'] ?? $purchaseOrder->entity_name,
                'fund_cluster' => $formData['fund_cluster'] ?? $purchaseOrder->fund_cluster,
                'supplier' => $purchaseOrder->supplier,
                'iar_date' => now(),
                'po_no' => $formData['po_number'] ?? $purchaseOrder->po_number,
                'po_date' => !empty($formData['po_date']) ? $formData['po_date'] : $purchaseOrder->date_of_purchase,
                'requisitioning_office' => $formData['requisitioning_office'] ?? $purchaseOrder->department,
                'responsibility_center_code' => $formData['responsibility_center_code'] ?? null,
                'responsibility_date' => !empty($formData['responsibility_date']) ? $formData['responsibility_date'] : null,
                'invoice_no' => $formData['invoice_number'] ?? null,
                'invoice_date' => !empty($formData['invoice_date']) ? $formData['invoice_date'] : null,
                'date_inspected' => !empty($formData['date_inspected']) ? $formData['date_inspected'] : (!empty($formData['inspected_by_date']) ? $formData['inspected_by_date'] : null),
                'date_received' => !empty($formData['date_received']) ? $formData['date_received'] : (!empty($formData['inspected_by_date_2']) ? $formData['inspected_by_date_2'] : null),
                'inspection_status' => $formData['inspection_status'] ?? 'Complete',
                'inspection_officer_label' => $formData['inspection_officer_label'] ?? ($formData['inspected_by_name'] ? ($formData['inspected_by_name'] . ' - ' . ($formData['inspected_by_position'] ?? '')) : null),
                'acceptance_status' => $formData['acceptance_status'] ?? 'Accepted',
                'custodian_label' => $formData['custodian_label'] ?? ($formData['inspected_by_name_2'] ? ($formData['inspected_by_name_2'] . ' - ' . ($formData['inspected_by_position_2'] ?? '')) : null),
                'items' => $iarItems,
                'status' => 'Active',
            ]);

            // Log activity
            \App\Models\Activity::create([
                'action' => 'Inspection and Acceptance Report Created',
                'meta' => json_encode([
                    'iar_no' => $iar->iar_no,
                    'po_number' => $purchaseOrder->po_number,
                    'items_count' => count($iarItems),
                ]),
            ]);

            return $iar;
        } catch (\Throwable $e) {
            \Log::error('Failed to create IAR record', [
                'error' => $e->getMessage(),
                'po_number' => $purchaseOrder->po_number,
            ]);

            return null;
        }
    }
}
