<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $table = 'support_tickets';

    protected $fillable = [
        'ticket_id',
        'name',
        'email',
        'message',
        'status',
    ];

    public function attachments(): HasMany
    {
        return $this->hasMany(SupportAttachment::class, 'support_ticket_id');
    }
}
