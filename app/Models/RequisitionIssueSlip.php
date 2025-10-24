<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequisitionIssueSlip extends Model
{
    use HasFactory;

    protected $table = 'requisition_issue_slips';

    protected $fillable = [
        'ris_no',
        'entity_name',
        'fund_cluster',
        'division',
        'responsibility_center_code',
        'office',
        'purpose',
        'items',
        'requested_by_signature',
        'requested_by_name',
        'requested_by_designation',
        'requested_by_date',
        'approved_by_signature',
        'approved_by_name',
        'approved_by_designation',
        'approved_by_date',
        'issued_by_signature',
        'issued_by_name',
        'issued_by_designation',
        'issued_by_date',
        'received_by_signature',
        'received_by_name',
        'received_by_designation',
        'received_by_date',
        'status',
    ];

    protected $casts = [
        'items' => 'array',
        'requested_by_date' => 'date',
        'approved_by_date' => 'date',
        'issued_by_date' => 'date',
        'received_by_date' => 'date',
    ];
}