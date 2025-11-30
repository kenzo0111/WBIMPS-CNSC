<?php

namespace App\Models;

use Spatie\Activitylog\Models\Activity as SpatieActivity;
use Illuminate\Database\Eloquent\Casts\AsArrayObject;

/**
 * App Activity model mapped to Spatie activity log model to ease transition.
 *
 * This class keeps the same interface (action/meta/actor_type/actor_id)
 * and maps them to Spatie's `description/properties/causer_type/causer_id`.
 */
class Activity extends SpatieActivity
{
    // Explicitly use Spatie activity table name
    protected $table = 'activity_log'; // Explicitly use Spatie activity table name

    /**
     * Keep fillable compatible with old columns, but prefer Spatie fields.
     */
    protected $fillable = [
        'description',
        'properties',
        'causer_type',
        'causer_id',
        'subject_type',
        'subject_id',
        'log_name',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    // Backwards-compatible attribute aliases for older code

    /**
     * Compatibility accessors for `action` and `meta`.
     */
    public function getActionAttribute()
    {
        return $this->attributes['description'] ?? null;
    }

    public function setActionAttribute($value)
    {
        $this->attributes['description'] = $value;
    }

    public function getMetaAttribute()
    {
        return $this->properties ?? null;
    }

    public function setMetaAttribute($value)
    {
        $this->properties = is_array($value) ? $value : json_decode($value, true);
    }

    /**
     * Accessor for actor_type/actor_id for compatibility.
     */
    public function getActorTypeAttribute()
    {
        return $this->attributes['causer_type'] ?? null;
    }

    public function setActorTypeAttribute($value)
    {
        $this->attributes['causer_type'] = $value;
    }

    public function getActorIdAttribute()
    {
        return $this->attributes['causer_id'] ?? null;
    }

    public function setActorIdAttribute($value)
    {
        $this->attributes['causer_id'] = $value;
    }
}

