<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockIn extends Model
{
    protected $table = 'stock_in';

    protected $fillable = [
        'transaction_id',
        'sku',
        'product_name',
        'quantity',
        'unit_cost',
        'supplier',
        'date_received'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'date_received' => 'date',
    ];
}
