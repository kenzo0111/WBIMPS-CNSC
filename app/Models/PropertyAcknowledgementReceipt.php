<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyAcknowledgementReceipt extends Model
{
    use HasFactory;

    protected $table = 'property_acknowledgement_receipts';

    protected $fillable = [
        'par_no',
        'entity_name',
        'fund_cluster',
        'date',
        'items',
        'received_by_name',
        'received_by_position',
        'received_date',
        'issued_by_name',
        'issued_by_position',
        'issued_date',
        'status',
    ];

    protected $casts = [
        'items' => 'array',
        'date' => 'date',
        'received_date' => 'date',
        'issued_date' => 'date',
    ];
}
