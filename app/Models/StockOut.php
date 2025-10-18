<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockOut extends Model
{
    protected $table = 'stock_out';

    protected $fillable = [
        'transaction_id',
        'sku',
        'product_name',
        'quantity',
        'recipient',
        'purpose',
        'date_issued'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'date_issued' => 'date',
    ];
}
