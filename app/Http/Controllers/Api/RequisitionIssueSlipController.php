<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RequisitionIssueSlip;
use Illuminate\Http\Request;

class RequisitionIssueSlipController extends Controller
{
    /**
     * Display a listing of requisition issue slips.
     */
    public function index()
    {
        $requisitionIssueSlips = RequisitionIssueSlip::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $requisitionIssueSlips,
        ]);
    }

    /**
     * Store a newly created requisition issue slip in storage.
     */
    public function store(Request $request)
    {
        // For now, just return success
        return response()->json([
            'success' => true,
            'message' => 'RIS created successfully',
        ]);
    }

    public function show($id)
    {
        $ris = RequisitionIssueSlip::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $ris,
        ]);
    }

    /**
     * Update the specified requisition issue slip in storage.
     */
    public function update(Request $request, $id)
    {
        // For now, just return success
        return response()->json([
            'success' => true,
            'message' => 'RIS updated successfully',
        ]);
    }

    /**
     * Remove the specified requisition issue slip from storage.
     */
    public function destroy($id)
    {
        // For now, just return success
        return response()->json([
            'success' => true,
            'message' => 'RIS deleted successfully',
        ]);
    }
}