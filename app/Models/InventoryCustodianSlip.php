<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $ics_no
 * @property string|null $entity_name
 * @property string|null $fund_cluster
 * @property array|null $items
 * @property float|null $grand_total
 * @property string|null $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class InventoryCustodianSlip extends Model
{
    use HasFactory;

    protected $table = 'inventory_custodian_slips';

    protected $fillable = [
        'ics_no',
        'entity_name',
        'fund_cluster',
        'items',
        'grand_total',
        'status',
    ];

    protected $casts = [
        'items' => 'array',
        'grand_total' => 'decimal:2',
    ];
}