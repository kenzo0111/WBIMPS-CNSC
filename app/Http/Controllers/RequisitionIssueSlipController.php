<?php

namespace App\Http\Controllers;

use App\Models\RequisitionIssueSlip;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

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
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties(['ris_no' => $ris->ris_no, 'ris_id' => $ris->id])
                ->log('Created Requisition Issue Slip');
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for RIS creation', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'RIS created successfully',
            'data' => $ris,
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
        $data = $request->all();

        // Debug: log the incoming payload
        logger()->debug('generatePDF RIS payload', is_array($data) ? $data : ['payload' => $data]);

        $data['items'] = collect($request->input('items', []))
            ->filter(fn($item) => filled($item['description'] ?? null))
            ->map(function ($item) {
                return [
                    'stock_no' => $item['stock_no'] ?? '',
                    'unit' => $item['unit'] ?? '',
                    'description' => $item['description'] ?? '',
                    'quantity' => $item['quantity'] ?? '',
                    'stock_available' => $item['stock_available'] ?? '',
                    'issue_quantity' => $item['issue_quantity'] ?? '',
                    'remarks' => $item['remarks'] ?? '',
                ];
            })
            ->values()
            ->all();

        $data['entity_name'] = $data['entity_name'] ?? 'Camarines Norte State College';
        $data['fund_cluster'] = $data['fund_cluster'] ?? '';

        $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => (object) $data])->setPaper('a4', 'portrait');

        // Record activity
        try {
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties(['ris_no' => $data['ris_no'] ?? null])
                ->log('Generated Requisition Issue Slip PDF');
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for RIS PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('requisition_issue_slip.pdf');
    }

    /**
     * Preview a requisition issue slip with ID (stream PDF in browser)
     */
    public function preview($id = null)
    {
        // If an ID is provided, load the requisition issue slip from the database
        if ($id) {
            // First, try to find RIS by its own ID
            $ris = \App\Models\RequisitionIssueSlip::find($id);

            // If not found, try to find RIS by purchase_order_id
            if (!$ris) {
                $ris = \App\Models\RequisitionIssueSlip::where('purchase_order_id', $id)->first();
            }

            if (!$ris) {
                abort(404, 'Requisition Issue Slip not found');
            }

            $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => $ris])->setPaper('a4', 'portrait');

            return $pdf->stream('requisition_issue_slip_' . $ris->ris_no . '.pdf');
        }

        // Provide empty/blank data so the preview renders a clean sheet (layout only)
        $sample = (object) [
            'ris_no' => '',
            'entity_name' => '',
            'fund_cluster' => '',
            'division' => '',
            'responsibility_center_code' => '',
            'office' => '',
            'purpose' => '',
            'items' => [],
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

        // Generate PDF and stream to browser for preview (blank template)
        $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => $sample])->setPaper('a4', 'portrait');

        return $pdf->stream('requisition_issue_slip_preview.pdf');
    }

    /**
     * Generate and download PDF for a requisition issue slip from the database.
     */
    public function downloadPDF($id)
    {
        // First, try to find RIS by its own ID
        $ris = \App\Models\RequisitionIssueSlip::find($id);

        // If not found, try to find RIS by purchase_order_id
        if (!$ris) {
            $ris = \App\Models\RequisitionIssueSlip::where('purchase_order_id', $id)->first();
        }

        if (!$ris) {
            abort(404, 'Requisition Issue Slip not found');
        }

        $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => $ris])->setPaper('a4', 'portrait');

        // Record activity
        try {
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties([
                    'ris_no' => $ris->ris_no,
                    'id' => $ris->id,
                ])
                ->log('Downloaded Requisition Issue Slip PDF');
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for RIS PDF download', ['error' => $e->getMessage()]);
        }

        return $pdf->download('requisition_issue_slip_' . $ris->ris_no . '.pdf');
    }
}
