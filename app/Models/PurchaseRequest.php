<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    protected $casts = [
        'items' => 'array',
        'submitted_at' => 'datetime',
        'metadata' => 'array',
    ];
}
