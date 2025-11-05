<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $ris_no
 * @property string|null $entity_name
 * @property string|null $fund_cluster
 * @property string|null $division
 * @property string|null $responsibility_center_code
 * @property string|null $office
 * @property string|null $purpose
 * @property array|null $items
 * @property string|null $requested_by_signature
 * @property string|null $requested_by_name
 * @property string|null $requested_by_designation
 * @property \Illuminate\Support\Carbon|null $requested_by_date
 * @property string|null $approved_by_signature
 * @property string|null $approved_by_name
 * @property string|null $approved_by_designation
 * @property \Illuminate\Support\Carbon|null $approved_by_date
 * @property string|null $issued_by_signature
 * @property string|null $issued_by_name
 * @property string|null $issued_by_designation
 * @property \Illuminate\Support\Carbon|null $issued_by_date
 * @property string|null $received_by_signature
 * @property string|null $received_by_name
 * @property string|null $received_by_designation
 * @property \Illuminate\Support\Carbon|null $received_by_date
 * @property string|null $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class RequisitionIssueSlip extends Model
{
    use HasFactory;

    protected $table = 'requisition_issue_slips';

    protected $fillable = [
        'ris_no',
        'purchase_order_id',
        'entity_name',
        'fund_cluster',
        'division',
        'responsibility_center_code',
        'office',
        'purpose',
        'items',
        'requested_by_signature',
        'requested_by_name',
        'requested_by_designation',
        'requested_by_date',
        'approved_by_signature',
        'approved_by_name',
        'approved_by_designation',
        'approved_by_date',
        'issued_by_signature',
        'issued_by_name',
        'issued_by_designation',
        'issued_by_date',
        'received_by_signature',
        'received_by_name',
        'received_by_designation',
        'received_by_date',
        'status',
    ];

    protected $casts = [
        'items' => 'array',
        'requested_by_date' => 'date',
        'approved_by_date' => 'date',
        'issued_by_date' => 'date',
        'received_by_date' => 'date',
    ];

    /**
     * Get the purchase order associated with this RIS.
     */
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}