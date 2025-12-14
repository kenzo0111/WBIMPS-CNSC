<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $transaction_id
 * @property string $sku
 * @property string $product_name
 * @property int $quantity
 * @property float $unit_cost
 * @property string|null $supplier
 * @property string $date_received
 * @property string|null $received_by
 * @property string|null $fund_cluster
 */
class StockIn extends Model
{
    use HasFactory;

    protected $table = 'stock_in';

    protected $fillable = [
        'transaction_id',
        'sku',
        'product_name',
        'quantity',
        'unit_cost',
        'supplier',
        'date_received',
        'received_by',
        'fund_cluster',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'date_received' => 'date',
        'received_by' => 'string',
        'fund_cluster' => 'string',
    ];
}
