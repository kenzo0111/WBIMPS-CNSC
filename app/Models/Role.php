<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    /**
     * Override hasPermissionTo so that a role possessing the special
     * 'manage everything' permission implicitly has any permission.
     *
     * @param string|\Spatie\Permission\Models\Permission $permission
     * @param string|null $guardName
     * @return bool
     */
    public function hasPermissionTo($permission, string $guardName = null): bool
    {
        // Normalize permission name when a Permission instance is passed
        $name = is_string($permission) ? $permission : ($permission->name ?? null);

        // If this role has the 'manage everything' permission, grant access to everything
        $perms = $this->permissions->pluck('name')->map(fn($n) => strtolower($n))->toArray();
        if (in_array('manage everything', $perms, true)) {
            return true;
        }

        return parent::hasPermissionTo($permission, $guardName);
    }
}
