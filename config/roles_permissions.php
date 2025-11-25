<?php

return [
    // Roles recognized by the application. 'slug' can help canonical lookup.
    'roles' => [
        ['name' => 'System Admin', 'slug' => 'system-admin'],
        ['name' => 'Administrator', 'slug' => 'administrator'],
        ['name' => 'Supply Officer', 'slug' => 'supply-officer'],
        ['name' => 'Office Assistant', 'slug' => 'office-assistant'],
        ['name' => 'Student Assistant', 'slug' => 'student-assistant'],
    ],

    // Permissions available in the app
    'permissions' => [
        'manage everything',
        'manage categories',
        'manage items',
        'manage supplies',
        'manage stock in',
        'manage stock out',
        'create requests',
        'manage requests',
        'view reports',
    ],

    // Mapping of role names to permission names
    'role_permissions' => [
        'System Admin' => [
            'manage everything',
            'manage categories',
            'manage items',
            'manage supplies',
            'manage stock in',
            'manage stock out',
            'create requests',
            'manage requests',
            'view reports',
        ],

        'Administrator' => [
            'manage categories',
            'manage items',
            'manage supplies',
            'manage requests',
            'view reports',
        ],

        'Supply Officer' => [
            'manage items',
            'manage supplies',
            'create requests',
            'manage requests',
        ],

        'Office Assistant' => ['create requests', 'view reports'],

        'Student Assistant' => ['create requests', 'manage stock in', 'manage stock out'],
    ],
];
