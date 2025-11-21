<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $sku
 * @property string $name
 * @property string|null $description
 * @property int|null $category_id
 * @property int $quantity
 * @property string|null $unit
 * @property float $unit_cost
 * @property float $total_value
 * @property string|null $date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Category|null $category
 */
class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'name',
        'description',
        'category_id',
        'quantity',
        'unit',
        'unit_cost',
        'total_value',
        'date',
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
        static::saving(function (Item $item) {
            $item->total_value = (float) $item->quantity * (float) $item->unit_cost;
        });
    }
}
