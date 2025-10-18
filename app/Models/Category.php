<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    // Keep numeric auto-incrementing primary key; add 'code' for display (C001)
    protected $fillable = ['code', 'name', 'description'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
