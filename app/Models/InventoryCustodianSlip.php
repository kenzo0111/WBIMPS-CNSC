<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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