<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'description',
        'category_id',
        'quantity',
        'unit',
        'unit_cost',
        'total_value',
        'date'
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Product $product) {
            $product->total_value = (float) $product->quantity * (float) $product->unit_cost;
        });
    }
}
