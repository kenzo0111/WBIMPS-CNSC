<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property string|null $role
 * @property bool $is_admin
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles {
        HasRoles::hasRole as traitHasRole;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'remember_token',
        'status',
        'role',
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    /**
     * The attribute casting map.
     *
     * @var array<string,string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_admin' => 'boolean',
        'status' => 'string',
    ];

    /**
     * Return whether the user is an administrator.
     */
    public function isAdmin(): bool
    {
        // Keep the legacy flag but also treat users with an admin role as administrator
        if ($this->is_admin ?? false)
            return true;

        // legacy single `role` column may contain a human-readable role name
        if (!empty($this->role)) {
            $legacy = strtolower(trim($this->role));
            if (in_array($legacy, ['system admin', 'administrator'], true)) {
                return true;
            }
        }

        // Spatie roles: consider both 'System Admin' and 'Administrator' as admin roles
        return $this->traitHasRole(['System Admin', 'Administrator']);
    }

    /**
     * Check if the user has a role by name or slug (compatibility wrapper)
     */
    public function hasRole(string $role): bool
    {
        // allow checking both the legacy single string `role` attribute and the new spatie relationship
        if ($this->role && strcasecmp($this->role, $role) === 0) {
            return true;
        }

        // delegate to spatie's trait implementation (supports names, arrays, etc.)
        return $this->traitHasRole($role);
    }

    /**
     * Keep an app-level hasPermission check for compatibility with existing code.
     */
    public function hasPermission(string $permission): bool
    {
        $slug = $this->slugify($permission);

        // spatie exposes hasPermissionTo — check both provided name and slug
        return $this->hasPermissionTo($permission) || $this->hasPermissionTo($slug);
    }

    protected function slugify(string $value): string
    {
        return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $value), '-'));
    }
}
