<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfPreviewController extends Controller
{
    /**
     * Stream Appendix 71 Property Acknowledgment Receipt PDF for preview.
     */
    public function previewAppendix71(Request $request)
    {
        $data = [
            'entityName' => '',
            'fundCluster' => '',
            'parNo' => '',
            'date' => now()->toDateString(),
            'rows' => 18,
            'receivedByName' => '',
            'receivedByPosition' => '',
            'receivedDate' => '',
            'issuedByName' => '',
            'issuedByPosition' => '',
            'issuedDate' => '',
        ];

        // Use `Pdf` facade if barryvdh/laravel-dompdf is installed and configured.
        try {
            $pdf = Pdf::loadView('pdf.property_acknowledge_report_pdf', $data)
                ->setPaper('a4', 'portrait');

            return $pdf->stream('Appendix71_PropertyAcknowledgmentReceipt.pdf');
        } catch (\Throwable $e) {
            // Fallback: return the HTML view for debugging if PDF render fails
            // pass the error message to the view under 'pdf_error'
            return view('pdf.property_acknowledge_report_pdf', $data)->with('pdf_error', $e->getMessage());
        }
    }
}
