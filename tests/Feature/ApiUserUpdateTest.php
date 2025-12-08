<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ApiUserUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_update_user_role_only()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'Test Role', 'guard_name' => 'web']);

        $response = $this->putJson("/api/users/{$user->id}", [
            'role' => 'Test Role',
        ]);

        $response->assertStatus(200);
        $this->assertTrue($user->fresh()->hasRole('Test Role'));
    }

    public function test_can_update_user_name_and_email()
    {
        $user = User::factory()->create();

        $response = $this->putJson("/api/users/{$user->id}", [
            'name' => 'New Name',
            'email' => 'newemail@example.com',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('New Name', $user->fresh()->name);
        $this->assertEquals('newemail@example.com', $user->fresh()->email);
    }

    public function test_validation_fails_if_email_is_invalid()
    {
        $user = User::factory()->create();

        $response = $this->putJson("/api/users/{$user->id}", [
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422);
    }

    public function test_can_update_is_admin_only()
    {
        $user = User::factory()->create();

        $response = $this->putJson("/api/users/{$user->id}", [
            'is_admin' => true,
        ]);

        $response->assertStatus(200);
        // Check if System Admin role is assigned (logic in controller)
        $this->assertTrue($user->fresh()->hasRole('System Admin'));
    }
}
