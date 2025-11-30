<?php

namespace App\Http\Controllers;

use App\Models\PropertyAcknowledgementReceipt;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class PropertyAcknowledgementReceiptController extends Controller
{
    /**
     * Stream a preview of the Appendix 71 Property Acknowledgment Receipt PDF.
     * Accepts an $id to lookup the specific PAR record from the database.
     * The ID can be either a PAR ID or a Purchase Order ID.
     */
    public function preview(Request $request, $id = null)
    {
        // If an ID is provided, try to fetch the PAR from database
        if ($id) {
            // First, try to find PAR by its own ID
            $par = PropertyAcknowledgementReceipt::find($id);

            // If not found, try to find PAR by purchase_order_id
            if (!$par) {
                $par = PropertyAcknowledgementReceipt::where('purchase_order_id', $id)->first();
            }

            if ($par) {
                // Prepare data from the database model
                $data = [
                    'entityName' => $par->entity_name ?? '',
                    'fundCluster' => $par->fund_cluster ?? '',
                    'parNo' => $par->par_no ?? '',
                    'date' => $par->date ? $par->date->format('Y-m-d') : now()->toDateString(),
                    'items' => $par->items ?? [],
                    'grandTotal' => $par->grand_total ?? 0,
                    'receivedByName' => $par->received_by_name ?? '',
                    'receivedByPosition' => $par->received_by_position ?? '',
                    'receivedDate' => $par->received_date ? $par->received_date->format('Y-m-d') : '',
                    'issuedByName' => $par->issued_by_name ?? '',
                    'issuedByPosition' => $par->issued_by_position ?? '',
                    'issuedDate' => $par->issued_date ? $par->issued_date->format('Y-m-d') : '',
                    'rows' => 18, // Number of empty rows if items is less
                ];
            } else {
                // PAR not found, return blank form with the ID
                $data = $this->getBlankFormData($id);
            }
        } else {
            // No ID provided, return blank form
            $data = $this->getBlankFormData();
        }

        try {
            $pdf = Pdf::loadView('pdf.property_acknowledge_report_pdf', $data)
                ->setPaper('a4', 'portrait');

            return $pdf->stream('Appendix71_PropertyAcknowledgmentReceipt.pdf');
        } catch (\Throwable $e) {
            // Fallback to rendering the HTML view for debugging when PDF fails
            return view('pdf.property_acknowledge_report_pdf', $data)->with('pdf_error', $e->getMessage());
        }
    }

    /**
     * Download PDF for a specific PAR record.
     * Similar to preview but forces download instead of streaming.
     */
    public function downloadPDF($id)
    {
        // First, try to find PAR by its own ID
        $par = PropertyAcknowledgementReceipt::find($id);

        // If not found, try to find PAR by purchase_order_id
        if (!$par) {
            $par = PropertyAcknowledgementReceipt::where('purchase_order_id', $id)->first();
        }

        if (!$par) {
            abort(404, 'Property Acknowledgement Receipt not found');
        }

        // Prepare data from the database model
        $data = [
            'entityName' => $par->entity_name ?? '',
            'fundCluster' => $par->fund_cluster ?? '',
            'parNo' => $par->par_no ?? '',
            'date' => $par->date ? $par->date->format('Y-m-d') : now()->toDateString(),
            'items' => $par->items ?? [],
            'grandTotal' => $par->grand_total ?? 0,
            'receivedByName' => $par->received_by_name ?? '',
            'receivedByPosition' => $par->received_by_position ?? '',
            'receivedDate' => $par->received_date ? $par->received_date->format('Y-m-d') : '',
            'issuedByName' => $par->issued_by_name ?? '',
            'issuedByPosition' => $par->issued_by_position ?? '',
            'issuedDate' => $par->issued_date ? $par->issued_date->format('Y-m-d') : '',
            'rows' => 18, // Number of empty rows if items is less
        ];

        try {
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties(['par_no' => $par->par_no, 'id' => $id])
                ->log('Downloaded Property Acknowledgement Receipt PDF');
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for PAR PDF download', ['error' => $e->getMessage()]);
        }

        $pdf = Pdf::loadView('pdf.property_acknowledge_report_pdf', $data)
            ->setPaper('a4', 'portrait');

        return $pdf->download('property_acknowledgement_receipt_' . ($par->par_no ?? $id) . '.pdf');
    }

    /**
     * Get blank form data for when no PAR is found or no ID is provided
     */
    private function getBlankFormData($id = null)
    {
        return [
            'entityName' => '',
            'fundCluster' => '',
            'parNo' => $id ?? '',
            'date' => now()->toDateString(),
            'items' => [],
            'grandTotal' => 0,
            'rows' => 18,
            'receivedByName' => '',
            'receivedByPosition' => '',
            'receivedDate' => '',
            'issuedByName' => '',
            'issuedByPosition' => '',
            'issuedDate' => '',
        ];
    }
}
