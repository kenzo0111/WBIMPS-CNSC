<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $user_id
 * @property string $email
 * @property string $name
 * @property string $action
 * @property \Illuminate\Support\Carbon $timestamp
 * @property string|null $ip_address
 * @property string|null $device
 * @property string|null $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $user
 */
class UserLog extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'name',
        'action',
        'timestamp',
        'ip_address',
        'device',
        'status',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
