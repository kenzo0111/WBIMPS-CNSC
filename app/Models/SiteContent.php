<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\AsArrayObject;

class SiteContent extends Model
{
    protected $table = 'site_contents';

    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];
}
