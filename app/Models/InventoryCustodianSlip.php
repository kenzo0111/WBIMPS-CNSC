<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int|null $purchase_order_id
 * @property string $ics_no
 * @property string|null $entity_name
 * @property string|null $fund_cluster
 * @property array|null $items
 * @property float|null $grand_total
 * @property string|null $status
 * @property string|null $received_from_name
 * @property string|null $received_from_position
 * @property \Illuminate\Support\Carbon|null $received_from_date
 * @property string|null $received_by_name
 * @property string|null $received_by_position
 * @property \Illuminate\Support\Carbon|null $received_by_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class InventoryCustodianSlip extends Model
{
    use HasFactory;

    protected $table = 'inventory_custodian_slips';

    protected $fillable = [
        'purchase_order_id',
        'ics_no',
        'entity_name',
        'fund_cluster',
        'items',
        'grand_total',
        'status',
        'received_from_name',
        'received_from_position',
        'received_from_date',
        'received_by_name',
        'received_by_position',
        'received_by_date',
    ];

    protected $casts = [
        'items' => 'array',
        'grand_total' => 'decimal:2',
        'received_from_date' => 'date',
        'received_by_date' => 'date',
    ];

    /**
     * Get the purchase order that owns this ICS.
     */
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}