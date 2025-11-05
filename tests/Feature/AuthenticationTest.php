<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('login page can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate with valid credentials', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('password123'),
        'status' => 'active',
    ]);

    $response = $this->post('/login', [
        'email' => 'test@example.com',
        'pin' => 'password123', // System uses 'pin' field
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'Login successful.',
        ]);
    $this->assertAuthenticated();
});

test('users cannot authenticate with invalid password', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('password123'),
        'status' => 'active',
    ]);

    $response = $this->post('/login', [
        'email' => 'test@example.com',
        'pin' => 'wrong-password',
    ]);

    $response->assertStatus(422);
    $this->assertGuest();
});

test('users cannot authenticate with inactive status', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('password123'),
        'status' => 'inactive',
    ]);

    $response = $this->post('/login', [
        'email' => 'test@example.com',
        'pin' => 'password123',
    ]);

    $response->assertStatus(422);
    $this->assertGuest();
});

test('authenticated users can logout', function () {
    $user = User::factory()->create(['status' => 'active']);

    $this->actingAs($user);

    $response = $this->post('/logout');

    $this->assertGuest();
    $response->assertStatus(200)
        ->assertJson([
            'message' => 'You have been signed out successfully.',
        ]);
});

test('login route has rate limiting', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('password123'),
        'status' => 'active',
    ]);

    // Make 6 login attempts (limit is 5 per minute)
    for ($i = 0; $i < 6; $i++) {
        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'pin' => 'wrong-password',
        ]);
    }

    // The 6th attempt should be rate limited
    $response->assertStatus(429);
});

test('password reset link request page can be rendered', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('password reset link can be requested', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
    ]);

    $response = $this->post('/forgot-password', [
        'email' => 'test@example.com',
    ]);

    // Password reset should succeed with 200 or redirect with 302
    expect($response->status())->toBeIn([200, 302]);
});

test('password reset has rate limiting', function () {
    $user = User::factory()->create(['email' => 'test@example.com']);

    // Make 4 reset attempts (limit is 3 per minute)
    for ($i = 0; $i < 4; $i++) {
        $response = $this->post('/forgot-password', [
            'email' => 'test@example.com',
        ]);
    }

    // The 4th attempt should be rate limited
    $response->assertStatus(429);
});
