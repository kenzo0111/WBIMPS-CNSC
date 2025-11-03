<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $ticket_id
 * @property string $name
 * @property string $email
 * @property string $message
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\SupportAttachment[] $attachments
 */
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
