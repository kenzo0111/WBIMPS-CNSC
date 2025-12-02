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
        $pdf = Pdf::loadView('pdf.stock-out-receipt', compact('stockOut'));
        return $pdf->download('stock-out-receipt-' . $stockOut->issue_id . '.pdf');
    }
}
