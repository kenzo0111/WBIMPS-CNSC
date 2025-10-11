<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PropertyAcknowledgementReceiptController extends Controller
{
    /**
     * Stream a preview of the Appendix 71 Property Acknowledgment Receipt PDF.
     * Accepts an $id for future lookups; currently returns a blank/sample preview.
     */
    public function preview(Request $request, $id = null)
    {
        $data = [
            'entityName' => '',
            'fundCluster' => '',
            'parNo' => $id ?? '',
            'date' => now()->toDateString(),
            'rows' => 18,
            'receivedByName' => '',
            'receivedByPosition' => '',
            'receivedDate' => '',
            'issuedByName' => '',
            'issuedByPosition' => '',
            'issuedDate' => '',
        ];

        try {
            $pdf = Pdf::loadView('pdf.property_acknowledge_report_pdf', $data)
                ->setPaper('a4', 'portrait');

            return $pdf->stream('Appendix71_PropertyAcknowledgmentReceipt.pdf');
        } catch (\Throwable $e) {
            // Fallback to rendering the HTML view for debugging when PDF fails
            return view('pdf.property_acknowledge_report_pdf', $data)->with('pdf_error', $e->getMessage());
        }
    }
}
