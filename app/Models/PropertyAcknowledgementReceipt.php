<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $par_no
 * @property string|null $entity_name
 * @property string|null $fund_cluster
 * @property \Illuminate\Support\Carbon|null $date
 * @property array|null $items
 * @property string|null $received_by_name
 * @property string|null $received_by_position
 * @property \Illuminate\Support\Carbon|null $received_date
 * @property string|null $issued_by_name
 * @property string|null $issued_by_position
 * @property \Illuminate\Support\Carbon|null $issued_date
 * @property string|null $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
