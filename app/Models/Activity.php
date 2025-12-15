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

    /**
     * Append accessor fields to model JSON output (sentence)
     */
    protected $appends = ['sentence'];

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

    /**
     * Human-readable sentence accessor for activities.
     *
     * Produces a sentence in the form: "[Actor Name] [action] [subject]".
     * Uses activity properties and description to detect the subject when possible.
     */
    public function getSentenceAttribute()
    {
        // Resolve actor name (if available) otherwise 'System'
        $actorName = 'System';
        try {
            if ($this->causer && is_object($this->causer)) {
                $actorName = $this->causer->name ?? $this->causer->email ?? 'System';
            } elseif (!empty($this->causer_type) && !empty($this->causer_id)) {
                // best-effort lookup (avoid heavy queries unless necessary)
                if (stripos($this->causer_type, 'user') !== false) {
                    $user = \App\Models\User::find($this->causer_id);
                    if ($user)
                        $actorName = $user->name ?? $user->email ?? 'User';
                }
            }
        } catch (\Throwable $e) {
            $actorName = $this->attributes['causer_id'] ?? 'System';
        }

        $desc = trim((string) ($this->description ?? ''));
        $descLower = strtolower($desc);

        $props = $this->properties ?? [];

        // Simple subject detection from common property keys
        $subject = null;
        $keys = ['name', 'title', 'ItemName', 'item_name', 'itemName', 'sku', 'transactionId', 'request_id', 'requestId', 'id', 'requestId'];
        foreach ($keys as $k) {
            if (!empty($props[$k])) {
                $subject = (string) $props[$k];
                break;
            }
        }

        // If not found, try to parse description for a colon, e.g. "Stock In: Item Name"
        $verb = null;
        if (!$subject && strpos($desc, ':') !== false) {
            [$left, $right] = array_map('trim', explode(':', $desc, 2));
            if ($right !== '') {
                $subject = $right;
            }
            $desc = $left; // left side is likely the action/verb
            $descLower = strtolower($desc);
        }

        // Attempt to find a verb from common action words if not present
        $verbs = ['created', 'deleted', 'updated', 'downloaded', 'generated', 'submitted', 'approved', 'rejected', 'logged in', 'logged out', 'login', 'logout', 'received', 'issued', 'created', 'added', 'removed', 'cancelled', 'canceled', 'saved', 'approved', 'stock in', 'stock out'];
        foreach ($verbs as $v) {
            if (stripos($descLower, $v) !== false) {
                $verb = $v;
                break;
            }
        }

        // If we couldn't find an explicit verb, attempt a fallback: take the whole description
        if ($verb === null && $desc !== '') {
            // Some descriptions are like "Purchase Order Created" - attempt to extract verb at end
            if (preg_match('/(.*)\b(' . implode('|', $verbs) . ')\b/i', $desc, $m)) {
                $verb = strtolower($m[2]);
                $subjectFromDesc = trim(preg_replace('/\b(' . preg_quote($verb, '/') . ')\b/i', '', $desc));
                if ($subjectFromDesc !== '')
                    $subject = $subject ?? $subjectFromDesc;
            }
        }

        // Compose sentence
        $actionPhrase = $desc !== '' ? $desc : '';
        // If we have an explicit terse verb use it
        if ($verb !== null) {
            $actionPhrase = $verb;
        }

        // If the description already includes subject text (e.g. contains 'of' or numbers) we will use the whole description
        $useFullDesc = false;
        if (preg_match('/\b(of|#|\d+|unit|units|pdf|pdf\)|\bPO#?\b|REQ-?|\d{4}-\d{2}-\d+|ICS|IAR|PAR)\b/i', $desc)) {
            $useFullDesc = true;
        }

        // Build final sentence variations
        if ($useFullDesc || ($actionPhrase !== '' && stripos($actionPhrase, ' ') !== false && empty($subject))) {
            // Prefer to attach the full original description
            $sentence = trim($desc);
            if ($sentence !== '') {
                return ucfirst(sprintf('%s %s', $actorName, lcfirst($sentence)));
            }
        }

        // If we have separate action + subject, combine them
        if (!empty($subject) && !empty($actionPhrase)) {
            // Ensure subject is a readable phrase
            $subjectPhrase = $subject;
            // If subject looks like an identifier, show as-is
            if (!preg_match('/^[#0-9A-Za-z\- ]+$/', $subjectPhrase)) {
                $subjectPhrase = trim($subjectPhrase);
            }
            // Add 'the' article for readability unless subject looks like an ID
            $articles = ['#', 'PO', 'ICS', 'IAR', 'PAR'];
            // If the subject is already in the YYYY-MM- format (our new request ID format) don't add 'the'
            if (preg_match('/^\d{4}-\d{2}/', $subjectPhrase)) {
                $needsThe = false;
            }
            $subjectText = $subjectPhrase;
            $needsThe = true;
            foreach ($articles as $a) {
                if (stripos($subjectPhrase, $a) === 0) {
                    $needsThe = false;
                    break;
                }
            }
            if ($needsThe)
                $subjectText = 'the ' . $subjectText;
            // Map certain verbs to more human past-tense forms for natural language
            $verbMap = [
                'login' => 'logged in',
                'logout' => 'logged out',
                'stock in' => 'stocked in',
                'stock out' => 'stocked out',
                'create' => 'created',
                'created' => 'created',
                'delete' => 'deleted',
                'download' => 'downloaded',
                'generate' => 'generated',
            ];
            if (isset($verb) && isset($verbMap[strtolower($verb)])) {
                $actionPhrase = $verbMap[strtolower($verb)];
            }
            return ucfirst(sprintf('%s %s %s', $actorName, lcfirst($actionPhrase), $subjectText));
        }

        // Finally, fallback to simply: "[Actor] [description]"
        if ($desc !== '') {
            return ucfirst(sprintf('%s %s', $actorName, lcfirst($desc)));
        }

        // Nothing to fall back to — just actor
        return $actorName;
    }
}

