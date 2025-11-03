<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $po_number
 * @property string $supplier
 * @property string|null $supplier_address
 * @property \Illuminate\Support\Carbon|null $date_of_purchase
 * @property string|null $tin_number
 * @property string|null $mode_of_procurement
 * @property string|null $place_of_delivery
 * @property string|null $delivery_term
 * @property \Illuminate\Support\Carbon|null $date_of_delivery
 * @property string|null $payment_term
 * @property array|null $items
 * @property float|null $grand_total
 * @property string|null $fund_cluster
 * @property string|null $ors_burs_no
 * @property string|null $funds_available
 * @property \Illuminate\Support\Carbon|null $ors_burs_date
 * @property float|null $ors_burs_amount
 * @property string|null $accountant_signature
 * @property string|null $entity_name
 * @property string|null $entity_address
 * @property string|null $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class PurchaseOrder extends Model
{
    use HasFactory;

    protected $table = 'purchase_orders';

    protected $fillable = [
        'po_number',
        'supplier',
        'supplier_address',
        'date_of_purchase',
        'tin_number',
        'mode_of_procurement',
        'place_of_delivery',
        'delivery_term',
        'date_of_delivery',
        'payment_term',
        'items',
        'grand_total',
        'fund_cluster',
        'ors_burs_no',
        'funds_available',
        'ors_burs_date',
        'ors_burs_amount',
        'accountant_signature',
        'entity_name',
        'entity_address',
        'status',
    ];

    protected $casts = [
        'items' => 'array',
        'date_of_purchase' => 'date',
        'date_of_delivery' => 'date',
        'ors_burs_date' => 'date',
        'grand_total' => 'decimal:2',
        'ors_burs_amount' => 'decimal:2',
    ];
}