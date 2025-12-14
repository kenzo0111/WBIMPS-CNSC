<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $transaction_id
 * @property string $issue_id
 * @property string $sku
 * @property string $product_name
 * @property int $quantity
 * @property float|null $unit_cost
 * @property float|null $total_cost
 * @property string|null $department
 * @property string|null $issued_to
 * @property string|null $issued_by
 * @property string|null $purpose
 * @property string|null $fund_cluster
 * @property string|null $responsibility_center_code
 * @property string $date_issued
 */
class StockOut extends Model
{
    use HasFactory;

    protected $table = 'stock_out';

    protected $fillable = [
        'transaction_id',
        'sku',
        'product_name',
        'quantity',
        'purpose',
        'date_issued',
        'issue_id',
        'unit_cost',
        'total_cost',
        'department',
        'issued_to',
        'issued_by',
        'fund_cluster',
        'responsibility_center_code',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'date_issued' => 'date',
        'quantity' => 'integer',
    ];
}
