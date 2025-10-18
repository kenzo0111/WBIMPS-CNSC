<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['action', 'meta', 'actor_type', 'actor_id'];
    // cast meta to array if stored as JSON
    protected $casts = [
        'meta' => 'array',
    ];
}
