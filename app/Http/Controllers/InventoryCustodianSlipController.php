<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class InventoryCustodianSlipController extends Controller
{
    public function generatePDF(Request $request)
    {
        $data = $this->prepareData($request);

        $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

        try {
            \App\Models\Activity::create(['action' => 'Generated Inventory Custodian Slip PDF', 'meta' => json_encode(['info' => null])]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for ICS PDF', ['error' => $e->getMessage()]);
        }

        return $pdf->download('inventory_custodian_slip.pdf');
    }

    public function preview(?Request $request = null, $id = null)
    {
        // If an ID is provided, load the inventory custodian slip from the database
        if ($id) {
            // First, try to find ICS by its own ID
            $ics = \App\Models\InventoryCustodianSlip::find($id);

            // If not found by ID, try to find by purchase order ID
            if (! $ics) {
                // Check if this ID is a purchase order ID
                $purchaseOrder = \App\Models\PurchaseOrder::find($id);

                if ($purchaseOrder) {
                    // Find ICS associated with this purchase order
                    $ics = \App\Models\InventoryCustodianSlip::where('purchase_order_id', $purchaseOrder->id)->first();
                }

                // If still not found, try to find purchase request and then purchase order
                if (! $ics) {
                    $purchaseRequest = \App\Models\PurchaseRequest::find($id);

                    if ($purchaseRequest) {
                        // Try to find purchase order by matching request_id or department
                        $purchaseOrder = \App\Models\PurchaseOrder::where('po_number', 'LIKE', '%'.$purchaseRequest->request_id.'%')
                            ->orWhere('department', $purchaseRequest->department)
                            ->first();

                        if ($purchaseOrder) {
                            // Find ICS by purchase_order_id
                            $ics = \App\Models\InventoryCustodianSlip::where('purchase_order_id', $purchaseOrder->id)->first();
                        }
                    }
                }
            }

            if (! $ics) {
                // Instead of 404, show empty form with a message
                $data = [
                    'entityName' => '',
                    'fundCluster' => '',
                    'parNo' => '',
                    'items' => [],
                    'grand_total' => 0,
                    'received_from_name' => '',
                    'received_from_position' => '',
                    'received_from_date' => '',
                    'received_by_name' => '',
                    'received_by_position' => '',
                    'received_by_date' => '',
                    'not_found_message' => 'Inventory Custodian Slip has not been created yet for this request.',
                ];

                $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

                return $pdf->stream('inventory_custodian_slip_pending.pdf');
            }

            // Prepare data from the model - mapping to match PDF template variable names
            $data = [
                'entityName' => $ics->entity_name ?? '',
                'fundCluster' => $ics->fund_cluster ?? '',
                'parNo' => $ics->ics_no ?? '',
                'items' => $ics->items ?? [],
                'grand_total' => $ics->grand_total ?? 0,
                'received_from_name' => $ics->received_from_name ?? '',
                'received_from_position' => $ics->received_from_position ?? '',
                'received_from_date' => $ics->received_from_date ? $ics->received_from_date->format('m/d/Y') : '',
                'received_by_name' => $ics->received_by_name ?? '',
                'received_by_position' => $ics->received_by_position ?? '',
                'received_by_date' => $ics->received_by_date ? $ics->received_by_date->format('m/d/Y') : '',
            ];

            $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

            return $pdf->stream('inventory_custodian_slip_'.($ics->ics_no ?? $id).'.pdf');
        }

        // If no ID is provided, use request data (for preview/generate)
        $data = $this->prepareData($request);

        $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

        return $pdf->stream('inventory_custodian_slip.pdf');
    }

    /**
     * Download ICS as PDF by ID (purchase order ID, ICS ID, or purchase request ID)
     */
    public function downloadPDF($id)
    {
        // Use the same logic as preview to find the ICS
        // First, try to find ICS by its own ID
        $ics = \App\Models\InventoryCustodianSlip::find($id);

        // If not found by ID, try to find by purchase order ID
        if (! $ics) {
            // Check if this ID is a purchase order ID
            $purchaseOrder = \App\Models\PurchaseOrder::find($id);

            if ($purchaseOrder) {
                // Find ICS associated with this purchase order
                $ics = \App\Models\InventoryCustodianSlip::where('purchase_order_id', $purchaseOrder->id)->first();
            }

            // If still not found, try to find purchase request and then purchase order
            if (! $ics) {
                $purchaseRequest = \App\Models\PurchaseRequest::find($id);

                if ($purchaseRequest) {
                    // Try to find purchase order by matching request_id or department
                    $purchaseOrder = \App\Models\PurchaseOrder::where('po_number', 'LIKE', '%'.$purchaseRequest->request_id.'%')
                        ->orWhere('department', $purchaseRequest->department)
                        ->first();

                    if ($purchaseOrder) {
                        // Find ICS by purchase_order_id
                        $ics = \App\Models\InventoryCustodianSlip::where('purchase_order_id', $purchaseOrder->id)->first();
                    }
                }
            }
        }

        if (! $ics) {
            // Return empty ICS form with message
            $data = [
                'entityName' => '',
                'fundCluster' => '',
                'parNo' => '',
                'items' => [],
                'grand_total' => 0,
                'received_from_name' => '',
                'received_from_position' => '',
                'received_from_date' => '',
                'received_by_name' => '',
                'received_by_position' => '',
                'received_by_date' => '',
                'not_found_message' => 'Inventory Custodian Slip has not been created yet for this request.',
            ];

            $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

            try {
                \App\Models\Activity::create([
                    'action' => 'Downloaded ICS PDF (Not Found)',
                    'meta' => json_encode(['id' => $id]),
                ]);
            } catch (\Throwable $e) {
                logger()->warning('Failed to record activity for ICS PDF download', ['error' => $e->getMessage()]);
            }

            return $pdf->download('inventory_custodian_slip_not_created.pdf');
        }

        // Prepare data from the model
        $data = [
            'entityName' => $ics->entity_name ?? '',
            'fundCluster' => $ics->fund_cluster ?? '',
            'parNo' => $ics->ics_no ?? '',
            'items' => $ics->items ?? [],
            'grand_total' => $ics->grand_total ?? 0,
            'received_from_name' => $ics->received_from_name ?? '',
            'received_from_position' => $ics->received_from_position ?? '',
            'received_from_date' => $ics->received_from_date ? $ics->received_from_date->format('m/d/Y') : '',
            'received_by_name' => $ics->received_by_name ?? '',
            'received_by_position' => $ics->received_by_position ?? '',
            'received_by_date' => $ics->received_by_date ? $ics->received_by_date->format('m/d/Y') : '',
        ];

        $pdf = Pdf::loadView('pdf.inventory_custodian_slip_pdf', $data);

        try {
            \App\Models\Activity::create([
                'action' => 'Downloaded Inventory Custodian Slip PDF',
                'meta' => json_encode([
                    'ics_no' => $ics->ics_no,
                    'ics_id' => $ics->id,
                    'po_id' => $ics->purchase_order_id,
                ]),
            ]);
        } catch (\Throwable $e) {
            logger()->warning('Failed to record activity for ICS PDF download', ['error' => $e->getMessage()]);
        }

        return $pdf->download('inventory_custodian_slip_'.($ics->ics_no ?? $id).'.pdf');
    }

    public function generateICS()
    {
        $pdf = Pdf::loadView('pdf.inventory_custodian_slip');

        return $pdf->setPaper('A4', 'portrait')->download('InventoryCustodianSlip.pdf');
    }

    private function prepareData(Request $request): array
    {
        $payload = $request->all();

        $items = collect($request->input('items', []))
            ->filter(fn ($item) => filled($item['description'] ?? null))
            ->map(function ($item) {
                $quantity = (float) ($item['quantity'] ?? 0);
                $unitCost = (float) ($item['unit_cost'] ?? 0);

                return [
                    'quantity' => $quantity,
                    'unit' => $item['unit'] ?? '',
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantity * $unitCost,
                    'description' => $item['description'] ?? '',
                    'item_no' => $item['item_no'] ?? '',
                    'useful_life' => $item['useful_life'] ?? '',
                ];
            })
            ->values()
            ->all();

        if (empty($items)) {
            $items = [[
                'quantity' => 0,
                'unit' => '',
                'unit_cost' => 0,
                'total_cost' => 0,
                'description' => '',
                'item_no' => '',
                'useful_life' => '',
            ]];
        }

        // Map to PDF template variable names
        return [
            'items' => $items,
            'grand_total' => collect($items)->sum('total_cost'),
            'entityName' => $payload['entity_name'] ?? $payload['entityName'] ?? '',
            'fundCluster' => $payload['fund_cluster'] ?? $payload['fundCluster'] ?? '',
            'parNo' => $payload['ics_no'] ?? $payload['parNo'] ?? '',
            'received_from_name' => $payload['received_from_name'] ?? '',
            'received_from_position' => $payload['received_from_position'] ?? '',
            'received_from_date' => $payload['received_from_date'] ?? '',
            'received_by_name' => $payload['received_by_name'] ?? '',
            'received_by_position' => $payload['received_by_position'] ?? '',
            'received_by_date' => $payload['received_by_date'] ?? '',
        ];
    }
}
