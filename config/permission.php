<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Permission/Role table names
    |--------------------------------------------------------------------------
    */
    'models' => [
        'permission' => Spatie\Permission\Models\Permission::class,
        // Use our application Role extension so we can add custom behavior (e.g. wildcard perms)
        'role' => App\Models\Role::class,
    ],

    'table_names' => [
        'roles' => 'roles',
        'permissions' => 'permissions',
        'model_has_permissions' => 'model_has_permissions',
        'model_has_roles' => 'model_has_roles',
        'role_has_permissions' => 'role_has_permissions',
    ],

    'column_names' => [
        'model_morph_key' => 'model_id',
    ],

    'guard_name' => 'web',
];
