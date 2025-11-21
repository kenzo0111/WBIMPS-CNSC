<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use App\Models\User;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Helper property used by many Pest tests. Declared here so static analysis
     * and editors know the property exists and its type.
     *
     * @var User|null
     */
    protected ?User $user = null;
}
