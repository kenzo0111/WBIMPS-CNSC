<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $action
 * @property array|null $meta
 * @property string|null $actor_type
 * @property int|null $actor_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Activity extends Model
{
    protected $fillable = ['action', 'meta', 'actor_type', 'actor_id'];
    // cast meta to array if stored as JSON
    protected $casts = [
        'meta' => 'array',
    ];
}
