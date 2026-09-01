<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DebugTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_debug_token_resolution(): void
    {
        fwrite(STDERR, "\nTEST default guard: " . config('auth.defaults.guard') . "\n");
        fwrite(STDERR, "TEST AUTH_GUARD env: " . env('AUTH_GUARD', '(unset)') . "\n");
        $this->artisan('db:seed', ['--force' => true]);

        $r1 = $this->postJson('/api/auth/login', ['email' => 'customer@demo.com', 'password' => 'password']);
        $t1 = $r1->json('data.token');
        fwrite(STDERR, "\ncustomer login token: {$t1}\n");
        fwrite(STDERR, "me says: " . $this->getJson('/api/auth/me', ['Authorization' => "Bearer {$t1}"])->json('data.user.email') . "\n");

        $r2 = $this->postJson('/api/auth/login', ['email' => 'admin@demo.com', 'password' => 'password']);
        fwrite(STDERR, "admin login full: " . $r2->getContent() . "
");
        foreach (\App\Models\User::all() as $u) { fwrite(STDERR, "user: {$u->id} {$u->email} active={$u->is_active}\n"); }
        $t2 = $r2->json('data.token');
        fwrite(STDERR, "admin login token: {$t2}\n");
        fwrite(STDERR, "me says: " . $this->getJson('/api/auth/me', ['Authorization' => "Bearer {$t2}"])->json('data.user.email') . "\n");

        $user = User::where('email', 'customer@demo.com')->first();
        fwrite(STDERR, "customer user id: {$user->id}, tokens: " . $user->tokens()->count() . "\n");

        $this->assertTrue(true);
    }
}
