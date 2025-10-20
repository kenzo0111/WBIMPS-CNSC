<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportAttachment extends Model
{
    protected $table = 'support_attachments';

    protected $fillable = [
        'support_ticket_id',
        'filename',
        'original_name',
        'mime',
        'size',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }
}
