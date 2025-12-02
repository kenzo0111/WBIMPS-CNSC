<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PurchaseRequestController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $request->all();

        // Normalize items into a consistent array structure. The UI may send:
        // - an array of item arrays (ideal)
        // - an array of strings (each string is an item description)
        // - a single string with newlines listing items
        $rawItems = $request->input('items', []);

        $items = collect();

        if (is_string($rawItems) && strlen(trim($rawItems)) > 0) {
            // items provided as one multiline string
            $lines = preg_split('/\r?\n/', trim($rawItems));
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '')
                    continue;
                $items->push([
                    'item_description' => $line,
                    'quantity' => 0,
                    'unit_cost' => 0,
                    'total_cost' => 0,
                    'unit' => $request->input('unit') ?? null,
                ]);
            }
        } elseif (is_array($rawItems)) {
            foreach ($rawItems as $entry) {
                // entry can be a string or array/object
                if (is_string($entry)) {
                    $entry = trim($entry);
                    if ($entry === '')
                        continue;
                    $items->push([
                        'item_description' => $entry,
                        'quantity' => 0,
                        'unit_cost' => 0,
                        'total_cost' => 0,
                    ]);
                    continue;
                }

                // ensure we can safely access array keys without throwing
                if (is_object($entry))
                    $entry = (array) $entry;

                $description = $entry['item_description'] ?? $entry['description'] ?? null;
                if (!filled($description))
                    continue;

                $quantity = (float) ($entry['quantity'] ?? 0);
                $unitCost = (float) ($entry['unit_cost'] ?? $entry['unitCost'] ?? 0);
                $totalCost = isset($entry['total_cost']) ? (float) $entry['total_cost'] : ($quantity * $unitCost);

                $items->push([
                    'item_description' => $description,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                    'unit' => $entry['unit'] ?? null,
                    'stock_no' => $entry['stock_no'] ?? null,
                ]);
            }
        }

        if ($items->isEmpty()) {
            $descriptions = collect($request->input('item_description', []));
            $quantities = collect($request->input('quantity', []));
            $unitCosts = collect($request->input('unit_cost', []));
            $totals = collect($request->input('total_cost', []));

            $items = $descriptions->map(function ($description, $index) use ($quantities, $unitCosts, $totals) {
                $quantity = (float) ($quantities->get($index) ?? 0);
                $unitCost = (float) ($unitCosts->get($index) ?? 0);

                return [
                    'item_description' => $description,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totals->get($index) ?? $quantity * $unitCost,
                ];
            })->filter(fn($item) => filled($item['item_description']));
        }

        $data['items'] = $items->values()->all();

        // Provide commonly-used defaults so the Blade view doesn't error when fields are missing
        $data['entity_name'] = $data['entity_name'] ?? 'Camarines Norte State College';
        $data['pr_no'] = $data['pr_no'] ?? '';
        $data['date'] = $data['date'] ?? Carbon::now()->toDateString();
        $data['purpose'] = $data['purpose'] ?? '';
        $data['requested_by'] = $data['requested_by'] ?? ($data['requestedBy'] ?? ($data['requester'] ?? ''));
        $data['designation'] = $data['designation'] ?? '';
        $data['approved_by'] = $data['approved_by'] ?? ($data['approvedBy'] ?? '');
        $data['approved_position'] = $data['approved_position'] ?? ($data['approvedPosition'] ?? ($data['approver_designation'] ?? ''));
        $data['fund_cluster'] = $data['fund_cluster'] ?? '';
        $data['responsibility_center_code'] = $data['responsibility_center_code'] ?? '';

        $pdf = Pdf::loadView('pdf.purchase_request_pdf', $data);
        try {
            activity()
                ->causedBy(\Illuminate\Support\Facades\Auth::user())
                ->withProperties(['pr_no' => $data['pr_no'] ?? null])
                ->log('Generated Purchase Request PDF');
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for PurchaseRequest PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('purchase_request.pdf');
    }

    /**
     * Stream a preview of the purchase request PDF.
     * Accepts an optional ID to load from the database.
     */
    public function preview($id = null)
    {
        // If an ID is provided, load the purchase request from the database
        if ($id) {
            $pr = \App\Models\PurchaseRequest::find($id);

            if (!$pr) {
                abort(404, 'Purchase Request not found');
            }

            // Prepare data from the model
            $data = [
                'entity_name' => $pr->entity_name ?? 'Camarines Norte State College',
                'pr_no' => $pr->pr_no ?? '',
                'date' => $pr->date ? $pr->date->format('Y-m-d') : Carbon::now()->toDateString(),
                'purpose' => $pr->purpose ?? '',
                'requested_by' => $pr->requested_by ?? '',
                'designation' => $pr->designation ?? '',
                'approved_by' => $pr->approved_by ?? '',
                'approved_position' => $pr->approved_position ?? '',
                'items' => $pr->items ?? [],
            ];

            $pdf = Pdf::loadView('pdf.purchase_request_pdf', $data)->setPaper('a4', 'portrait');

            return $pdf->stream('purchase_request_' . ($pr->pr_no ?? $id) . '.pdf');
        }

        // Preview with clean/empty placeholders (no sample data)
        $sample = [
            'entity_name' => '',
            // PR specific fields expected by the blade
            'pr_no' => '',
            'date' => Carbon::now()->toDateString(),
            'purpose' => '',
            'requested_by' => '',
            'designation' => '',
            'approved_by' => '',
            'approved_position' => '',
            // items should be an array of item arrays with keys used in the view
            'items' => [],
        ];

        $pdf = Pdf::loadView('pdf.purchase_request_pdf', $sample)->setPaper('a4', 'portrait');

        return $pdf->stream('purchase_request_preview.pdf');
    }
}
