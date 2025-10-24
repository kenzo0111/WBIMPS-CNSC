<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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