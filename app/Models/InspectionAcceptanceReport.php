<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $iar_no
 * @property string|null $entity_name
 * @property string|null $fund_cluster
 * @property string|null $supplier
 * @property \Illuminate\Support\Carbon|null $iar_date
 * @property string|null $po_no
 * @property \Illuminate\Support\Carbon|null $po_date
 * @property string|null $requisitioning_office
 * @property string|null $responsibility_center_code
 * @property \Illuminate\Support\Carbon|null $responsibility_date
 * @property string|null $invoice_no
 * @property \Illuminate\Support\Carbon|null $invoice_date
 * @property \Illuminate\Support\Carbon|null $date_inspected
 * @property \Illuminate\Support\Carbon|null $date_received
 * @property string|null $inspection_status
 * @property string|null $inspection_officer_label
 * @property string|null $acceptance_status
 * @property string|null $custodian_label
 * @property array|null $items
 * @property string|null $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class InspectionAcceptanceReport extends Model
{
    use HasFactory;

    protected $table = 'inspection_acceptance_reports';

    protected $fillable = [
        'purchase_order_id',
        'iar_no',
        'entity_name',
        'fund_cluster',
        'supplier',
        'iar_date',
        'po_no',
        'po_date',
        'requisitioning_office',
        'responsibility_center_code',
        'responsibility_date',
        'invoice_no',
        'invoice_date',
        'date_inspected',
        'date_received',
        'inspection_status',
        'inspection_officer_label',
        'acceptance_status',
        'custodian_label',
        'items',
        'status',
    ];

    protected $casts = [
        'items' => 'array',
        'iar_date' => 'date',
        'po_date' => 'date',
        'invoice_date' => 'date',
        'date_inspected' => 'date',
        'date_received' => 'date',
        'responsibility_date' => 'date',
    ];

    /**
     * Get the purchase order that owns this IAR.
     */
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
