<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $request_id
 * @property string $email
 * @property string $requester
 * @property string $designation
 * @property string $department
 * @property array $items
 * @property string|null $unit
 * @property int|null $quantity
 * @property float|null $unit_cost
 * @property string|null $needed_date
 * @property string|null $priority
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $submitted_at
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class PurchaseRequest extends Model
{
    use HasFactory;

    protected $table = 'purchase_requests';

    protected $fillable = [
        'request_id',
        'email',
        'requester',
        'department',
        'items',
        'unit',
        'needed_date',
        'priority',
        'status',
        'submitted_at',
        'metadata',
        'quantity',
        'unit_cost',
    ];

    protected $casts = [
        'items' => 'array',
        'submitted_at' => 'datetime',
        'metadata' => 'array',
    ];
}
