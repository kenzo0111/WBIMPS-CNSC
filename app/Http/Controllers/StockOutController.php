<?php

namespace App\Http\Controllers;

use App\Models\StockOut;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class StockOutController extends Controller
{
    public function downloadPDF($id)
    {
        $stockOut = StockOut::findOrFail($id);

        // Get all stock out records with the same issue_id, joined with items to get unit
        $stockOutRecords = StockOut::where('issue_id', $stockOut->issue_id)
            ->leftJoin('items', 'stock_out.sku', '=', 'items.sku')
            ->select('stock_out.*', 'items.unit')
            ->orderBy('stock_out.created_at')
            ->get();

        // Transform stock out data into RIS format
        $risData = (object) [
            'ris_no' => $stockOut->issue_id,
            'entity_name' => 'Camarines Norte State College',
            'fund_cluster' => $stockOut->fund_cluster ?? '',
            'division' => $stockOut->department ?? '',
            'office' => '',
            'responsibility_center_code' => $stockOut->responsibility_center_code ?? '',
            'purpose' => $stockOut->purpose ?? '',
            'stock_available' => true,
            'items' => $stockOutRecords->map(function ($record) {
                return [
                    'stock_no' => $record->sku,
                    'unit' => $record->unit ?? '',
                    'description' => $record->product_name,
                    'quantity' => $record->quantity,
                    'stock_available' => 'Yes',
                    'issue_quantity' => $record->quantity,
                    'remarks' => '',
                ];
            })->toArray(),
            'requested_by_signature' => '',
            'requested_by_name' => $stockOut->issued_to ?? '',
            'requested_by_designation' => $stockOut->issued_to_designation ?? '',
            'requested_by_date' => $stockOut->date_issued,
            'approved_by_signature' => '',
            'approved_by_name' => $stockOut->approved_by ?? '',
            'approved_by_designation' => $stockOut->approved_by_designation ?? '',
            // If there's no explicit approved_by_date, fall back to the date_issued so the RIS shows a date
            'approved_by_date' => $stockOut->approved_by_date ?? $stockOut->date_issued ?? null,
            'issued_by_signature' => '',
            'issued_by_name' => $stockOut->issued_by ?? '',
            'issued_by_designation' => $stockOut->issued_by_designation ?? '',
            'issued_by_date' => $stockOut->date_issued,
            'received_by_signature' => '',
            'received_by_name' => $stockOut->issued_to ?? '',
            'received_by_designation' => $stockOut->issued_to_designation ?? '',
            'received_by_date' => $stockOut->date_issued,
        ];

        $pdf = Pdf::loadView('pdf.requisition_issue_slips_pdf', ['ris' => $risData])->setPaper('a4', 'portrait');

        return $pdf->download('requisition_issue_slip_' . $stockOut->issue_id . '.pdf');
    }
}
