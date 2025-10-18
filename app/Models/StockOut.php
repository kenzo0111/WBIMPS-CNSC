<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockOut extends Model
{
    protected $table = 'stock_out';

    protected $fillable = [
        'transaction_id',
        'issue_id',
        'sku',
        'product_name',
        'quantity',
        'unit_cost',
        'total_cost',
        'department',
        // 'recipient' removed: standardize on 'issued_to'
        'issued_to',
        'issued_by',
        'purpose',
        'status',
        'date_issued'
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'date_issued' => 'date',
        'quantity' => 'integer',
    ];
}
