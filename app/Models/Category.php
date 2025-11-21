<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string|null $code
 * @property string $name
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\item[] $products
 */
class Category extends Model
{
    use HasFactory;

    // Keep numeric auto-incrementing primary key; add 'code' for display (C001)
    protected $fillable = ['code', 'name', 'description'];

    public function products(): HasMany
    {
        return $this->hasMany(item::class);
    }
}
