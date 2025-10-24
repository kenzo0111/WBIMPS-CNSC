<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionAcceptanceReport extends Model
{
    use HasFactory;

    protected $table = 'inspection_acceptance_reports';

    protected $fillable = [
        'iar_no',
        'entity_name',
        'fund_cluster',
        'supplier',
        'iar_date',
        'po_no',
        'po_date',
        'requisitioning_office',
        'responsibility_center_code',
        'invoice_no',
        'invoice_date',
        'date_inspected',
        'date_received',
        'inspection_status',
        'acceptance_status',
        'items',
        'status',
    ];

    protected $casts = [
        'items' => 'array',
        'iar_date' => 'date',
        'po_date' => 'date',
        'invoice_date' => 'date',
        'date_inspected' => 'date',
        'date_received' => 'date',
    ];
}