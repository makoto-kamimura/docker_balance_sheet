<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Throttle middleware を毎テストでリセット
        RateLimiter::clear('api');
    }

    public function test_register_creates_user_and_returns_token(): void
    {
        $res = $this->postJson('/api/auth/register', [
            'name'                  => '山田 太郎',
            'email'                 => 'taro@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ]);

        $res->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token'])
            ->assertJsonPath('user.email', 'taro@example.com');

        $this->assertDatabaseHas('users', ['email' => 'taro@example.com']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dup@example.com']);

        $res = $this->postJson('/api/auth/register', [
            'name'                  => '別人',
            'email'                 => 'dup@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ]);

        $res->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_login_with_correct_credentials_returns_token(): void
    {
        User::factory()->create([
            'email'    => 'me@example.com',
            'password' => Hash::make('secret123'),
        ]);

        $res = $this->postJson('/api/auth/login', [
            'email'    => 'me@example.com',
            'password' => 'secret123',
        ]);

        $res->assertOk()->assertJsonStructure(['user', 'token']);
    }

    public function test_login_with_wrong_password_returns_401(): void
    {
        User::factory()->create([
            'email'    => 'me@example.com',
            'password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/auth/login', [
            'email'    => 'me@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(401);
    }

    public function test_me_requires_token(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('email', $user->email);
    }

    public function test_login_throttled_after_5_attempts_per_minute(): void
    {
        User::factory()->create([
            'email'    => 'me@example.com',
            'password' => Hash::make('secret'),
        ]);

        // 5 回までは 401 が返る
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'me@example.com', 'password' => 'wrong'])
                ->assertStatus(401);
        }
        // 6 回目は 429 (Too Many Requests)
        $this->postJson('/api/auth/login', ['email' => 'me@example.com', 'password' => 'wrong'])
            ->assertStatus(429);
    }
}
