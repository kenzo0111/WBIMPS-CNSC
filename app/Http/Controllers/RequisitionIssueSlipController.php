<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\RequisitionIssueSlip;

class RequisitionIssueSlipController extends Controller
{
    /**
     * Display a listing of all RIS records
     */
    public function index()
    {
        $risRecords = RequisitionIssueSlip::orderBy('created_at', 'desc')->get();
        return view('ris.index', compact('risRecords'));
    }

    /**
     * Store a new RIS record
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ris_no' => 'required|string|unique:requisition_issue_slips,ris_no',
            'entity_name' => 'nullable|string',
            'fund_cluster' => 'nullable|string',
            'division' => 'nullable|string',
            'responsibility_center_code' => 'nullable|string',
            'office' => 'nullable|string',
            'purpose' => 'nullable|string',
            'items' => 'nullable|array',
            'requested_by_name' => 'nullable|string',
            'requested_by_designation' => 'nullable|string',
            'requested_by_date' => 'nullable|date',
            'approved_by_name' => 'nullable|string',
            'approved_by_designation' => 'nullable|string',
            'approved_by_date' => 'nullable|date',
            'issued_by_name' => 'nullable|string',
            'issued_by_designation' => 'nullable|string',
            'issued_by_date' => 'nullable|date',
            'received_by_name' => 'nullable|string',
            'received_by_designation' => 'nullable|string',
            'received_by_date' => 'nullable|date',
        ]);

        $ris = RequisitionIssueSlip::create($validated);

        try {
            \App\Models\Activity::create([
                'action' => 'Created Requisition Issue Slip',
                'meta' => json_encode(['ris_no' => $ris->ris_no, 'ris_id' => $ris->id])
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for RIS creation', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'RIS created successfully',
            'data' => $ris
        ]);
    }

    /**
     * Display the specified RIS record
     */
    public function show($id)
    {
        $ris = RequisitionIssueSlip::findOrFail($id);
        return response()->json($ris);
    }

    public function generatePDF(Request $request)
    {
        // Check if we're generating from a saved RIS (using ris_id parameter)
        if ($request->has('ris_id')) {
            $ris = \App\Models\RequisitionIssueSlip::find($request->input('ris_id'));
            
            if (!$ris) {
                abort(404, 'Requisition Issue Slip not found');
            }

            $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => $ris]);

            try {
                \App\Models\Activity::create([
                    'action' => 'Generated Requisition Issue Slip PDF', 
                    'meta' => json_encode(['ris_no' => $ris->ris_no, 'ris_id' => $ris->id])
                ]);
            } catch (\Throwable $e) {
                logger()->warning('Failed to record activity for RIS PDF', ['error' => $e->getMessage()]);
            }

            return $pdf->download('requisition_issue_slip_' . $ris->ris_no . '.pdf');
        }

        // Check if we're generating from a request_id (purchase order ID from dashboard)
        if ($request->has('request_id')) {
            $id = $request->input('request_id');
            
            // Try to find RIS first
            $ris = \App\Models\RequisitionIssueSlip::find($id);
            
            if (!$ris) {
                // If RIS doesn't exist, try to find a purchase order with this ID
                // and generate RIS from it
                $purchaseOrder = \App\Models\PurchaseOrder::find($id);
                
                if ($purchaseOrder) {
                    // Generate RIS data from purchase order
                    $risData = $this->generateRisFromPurchaseOrder($purchaseOrder);
                    $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => (object)$risData]);
                    
                    try {
                        \App\Models\Activity::create([
                            'action' => 'Downloaded Requisition Issue Slip PDF from PO', 
                            'meta' => json_encode(['po_number' => $purchaseOrder->po_number, 'po_id' => $purchaseOrder->id])
                        ]);
                    } catch (\Throwable $e) {
                        logger()->warning('Failed to record activity for RIS PDF download', ['error' => $e->getMessage()]);
                    }
                    
                    return $pdf->download('RIS_from_PO_' . $purchaseOrder->po_number . '.pdf');
                }
                
                // If no purchase order found either, show error
                abort(404, 'Requisition Issue Slip not found. No associated Purchase Order found.');
            }

            // If RIS found, download it
            $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => $ris]);

            try {
                \App\Models\Activity::create([
                    'action' => 'Downloaded Requisition Issue Slip PDF', 
                    'meta' => json_encode(['ris_no' => $ris->ris_no, 'ris_id' => $ris->id])
                ]);
            } catch (\Throwable $e) {
                logger()->warning('Failed to record activity for RIS PDF download', ['error' => $e->getMessage()]);
            }

            return $pdf->download('RIS_' . $ris->ris_no . '.pdf');
        }

        // Otherwise, generate from form data
        $data = $this->prepareData($request);

        $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => (object)$data]);

        try {
            \App\Models\Activity::create(['action' => 'Generated Requisition Issue Slip PDF', 'meta' => json_encode(['ris_no' => $data['ris_no'] ?? null])]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for RIS PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('requisition_issue_slip.pdf');
    }

    public function preview(Request $request = null, $id = null)
    {
        // If an ID is provided, try to load the requisition issue slip from the database
        if ($id) {
            $ris = \App\Models\RequisitionIssueSlip::find($id);
            
            if (!$ris) {
                // If RIS doesn't exist, try to find a purchase order with this ID
                // and generate RIS from it
                $purchaseOrder = \App\Models\PurchaseOrder::find($id);
                
                if ($purchaseOrder) {
                    // Generate RIS data from purchase order
                    $risData = $this->generateRisFromPurchaseOrder($purchaseOrder);
                    $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => (object)$risData]);
                    return $pdf->stream('requisition_issue_slip_PO_' . $purchaseOrder->po_number . '.pdf');
                }
                
                // If no purchase order found either, show error
                abort(404, 'Requisition Issue Slip not found. Please create a RIS record first.');
            }

            $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => $ris]);
            return $pdf->stream('requisition_issue_slip_' . $ris->ris_no . '.pdf');
        }

        // If no ID is provided, use request data (for preview/generate)
        $data = $this->prepareData($request);

        $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => (object)$data]);

        return $pdf->stream('requisition_issue_slip.pdf');
    }

    /**
     * Generate RIS data from a Purchase Order
     */
    private function generateRisFromPurchaseOrder($purchaseOrder): array
    {
        $items = [];
        
        if (is_array($purchaseOrder->items)) {
            foreach ($purchaseOrder->items as $item) {
                $items[] = [
                    'stock_no' => $item['stock_no'] ?? '',
                    'unit' => $item['unit'] ?? '',
                    'description' => $item['item_description'] ?? $item['description'] ?? '',
                    'quantity' => $item['quantity'] ?? '',
                    'stock_available' => 'Yes', // Default
                    'issue_quantity' => $item['quantity'] ?? '',
                    'remarks' => '',
                ];
            }
        }

        return [
            'ris_no' => 'RIS-' . $purchaseOrder->po_number,
            'entity_name' => 'Camarines Norte State College',
            'fund_cluster' => '',
            'division' => '',
            'responsibility_center_code' => '',
            'office' => $purchaseOrder->supplier ?? '',
            'purpose' => $purchaseOrder->purpose ?? 'Generated from Purchase Order',
            'items' => $items,
            'requested_by_name' => '',
            'requested_by_designation' => '',
            'requested_by_date' => null,
            'approved_by_name' => '',
            'approved_by_designation' => '',
            'approved_by_date' => null,
            'issued_by_name' => '',
            'issued_by_designation' => '',
            'issued_by_date' => null,
            'received_by_name' => '',
            'received_by_designation' => '',
            'received_by_date' => null,
        ];
    }

    private function prepareData(Request $request): array
    {
        $payload = $request->all();

        $items = collect($request->input('items', []))
            ->filter(fn($item) => filled($item['description'] ?? null))
            ->map(function ($item) {
                return [
                    'stock_no' => $item['stock_no'] ?? '',
                    'unit' => $item['unit'] ?? '',
                    'description' => $item['description'] ?? '',
                    'quantity' => $item['quantity'] ?? '',
                    'stock_available_yes' => $item['stock_available_yes'] ?? false,
                    'stock_available_no' => $item['stock_available_no'] ?? false,
                    'issue_quantity' => $item['issue_quantity'] ?? '',
                    'remarks' => $item['remarks'] ?? '',
                ];
            })
            ->values()
            ->all();

        if (empty($items)) {
            $items = [[
                'stock_no' => '',
                'unit' => '',
                'description' => '',
                'quantity' => '',
                'stock_available_yes' => false,
                'stock_available_no' => false,
                'issue_quantity' => '',
                'remarks' => '',
            ]];
        }

        $payload['items'] = $items;
        $payload['entity_name'] = $payload['entity_name'] ?? '';
        $payload['fund_cluster'] = $payload['fund_cluster'] ?? '';
        $payload['division'] = $payload['division'] ?? '';
        $payload['responsibility_center_code'] = $payload['responsibility_center_code'] ?? '';
        $payload['office'] = $payload['office'] ?? '';
        $payload['ris_no'] = $payload['ris_no'] ?? '';
        $payload['purpose'] = $payload['purpose'] ?? '';

        return $payload;
    }
}
