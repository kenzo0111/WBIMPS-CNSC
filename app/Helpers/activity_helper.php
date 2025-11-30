<?php

use Illuminate\Support\Facades\Log;

/**
 * Minimal fallback for Spatie's `activity()` helper in environments
 * where `spatie/laravel-activitylog` is not installed (tests, CI,
 * or during migration). This provides a small chainable builder
 * that writes to the legacy `activities` table using the old model
 * so tests and seeders don't break before package installation.
 */
if (!function_exists('activity')) {
    function activity()
    {
        return new class {
            private $causer = null;
            private $properties = null;

            public function causedBy($user)
            {
                $this->causer = $user;
                return $this;
            }

            public function withProperties($properties)
            {
                $this->properties = $properties;
                return $this;
            }

            public function log($description)
            {
                try {
                    // fallback to App\Models\Activity to record a legacy activity
                    $payload = [
                        'action' => $description,
                        'meta' => is_array($this->properties) ? $this->properties : ($this->properties ?? null),
                    ];

                    if ($this->causer && method_exists($this->causer, 'getKey')) {
                        $payload['actor_type'] = get_class($this->causer);
                        $payload['actor_id'] = $this->causer->getKey();
                    }

                    return \App\Models\Activity::create($payload);
                } catch (\Throwable $e) {
                    Log::warning('Fallback activity logging failed: ' . $e->getMessage());
                    return null;
                }
            }
        };
    }
}
