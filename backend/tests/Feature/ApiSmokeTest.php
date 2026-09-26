<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * End-to-end API smoke tests.
 *
 * These exercise the public search surface, the auth lifecycle, the
 * booking -> payment -> confirmation pipeline, and the PDF downloads
 * against the seeded demo providers.
 *
 * Note: Sanctum's RequestGuard memoizes the resolved user per application
 * instance. Laravel's test client keeps one app instance per test, so we
 * call forgetGuards() when switching users to keep token resolution honest.
 */
class ApiSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('db:seed', ['--force' => true]);
    }

    protected function login(string $email): string
    {
        // Reset memoized guard state so the request resolves tokens fresh
        $this->app['auth']->forgetGuards();

        $response = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password',
        ]);

        $response->assertStatus(200)->assertJsonPath('success', true);

        return $response->json('data.token');
    }

    protected function authed(string $token): array
    {
        return ['Authorization' => "Bearer {$token}"];
    }

    protected function getAuthed(string $url, string $token): \Illuminate\Testing\TestResponse
    {
        $this->app['auth']->forgetGuards();
        return $this->getJson($url, $this->authed($token));
    }

    protected function postAuthed(string $url, array $data, string $token): \Illuminate\Testing\TestResponse
    {
        $this->app['auth']->forgetGuards();
        return $this->postJson($url, $data, $this->authed($token));
    }

    /**
     * Get a bearer token for the given seeded user, resolving fresh.
     */
    protected function token(string $email): string
    {
        return $this->login($email);
    }

    public function test_all_nine_search_endpoints_respond_successfully(): void
    {
        $cases = [
            '/api/search/hotels?destination=Dubai&check_in=' . now()->addDays(7)->toDateString() . '&check_out=' . now()->addDays(10)->toDateString(),
            '/api/search/flights?origin=DEL&destination=BOM&departure_date=' . now()->addDays(7)->toDateString(),
            '/api/search/trains?origin=Delhi&destination=Mumbai&journey_date=' . now()->addDays(3)->toDateString(),
            '/api/search/buses?origin=Delhi&destination=Jaipur&journey_date=' . now()->addDays(3)->toDateString(),
            '/api/search/venues?city=Dubai&event_date=' . now()->addDays(14)->toDateString(),
            '/api/search/cars?city=Delhi&pickup_date=' . now()->addDays(3)->toDateString() . '&return_date=' . now()->addDays(6)->toDateString(),
            '/api/search/activities?city=Dubai&date=' . now()->addDays(3)->toDateString(),
            '/api/search/transfers?city=Dubai&date=' . now()->addDays(3)->toDateString(),
            '/api/search/packages?destination=Bali',
        ];

        foreach ($cases as $url) {
            $response = $this->getJson($url);
            $this->assertSame(
                200,
                $response->status(),
                "Search endpoint failed: {$url} — {$response->getContent()}"
            );
            $this->assertTrue($response->json('success'), "success flag missing for {$url}");
            $this->assertIsArray(
                $response->json('data.results'),
                "results array missing for {$url}"
            );
        }
    }

    public function test_auth_me_returns_the_authenticated_user(): void
    {
        $token = $this->token('customer@demo.com');

        $this->getAuthed('/api/auth/me', $token)
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'customer@demo.com');
    }

    public function test_service_detail_endpoints_return_details(): void
    {
        foreach (['/api/hotels/1', '/api/flights/1'] as $url) {
            $this->getJson($url)
                ->assertStatus(200)
                ->assertJsonPath('success', true);
        }

        // Venues resolve through the provider manager
        $this->getJson('/api/venues/1')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_booking_payment_confirmation_pipeline(): void
    {
        $token = $this->token('customer@demo.com');

        // Create a booking for a hotel room
        $create = $this->postAuthed('/api/bookings', [
            'items' => [[
                'item_type' => 'hotel',
                'service_id' => 1,
                'configuration' => [
                    'rooms' => 1,
                    'check_in' => now()->addDays(7)->toDateString(),
                    'check_out' => now()->addDays(10)->toDateString(),
                ],
                'travelers' => [[
                    'first_name' => 'Smoke',
                    'last_name' => 'Test',
                    'email' => 'smoke@test.local',
                ]],
            ]],
            'currency' => 'INR',
        ], $token);

        $create->assertStatus(201)->assertJsonPath('success', true);

        $booking = $create->json('data');
        $this->assertNotEmpty($booking['booking_reference']);
        $this->assertGreaterThan(0, (float) $booking['grand_total'], 'grand_total should be priced');

        // Look up by reference
        $this->getAuthed("/api/bookings/reference/{$booking['booking_reference']}", $token)
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // Initiate and process payment — demo gateway captures and confirms
        $initiate = $this->postAuthed('/api/payments/initiate', [
            'booking_id' => $booking['id'],
            'payment_method_id' => 1,
        ], $token);

        $initiate->assertStatus(201)->assertJsonPath('success', true);
        $paymentId = $initiate->json('data.id');

        $process = $this->postAuthed("/api/payments/{$paymentId}/process", [], $token);
        $process->assertStatus(200)->assertJsonPath('success', true);

        // Booking should now be confirmed and paid
        $this->getAuthed("/api/bookings/{$booking['id']}", $token)
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'paid');

        // Voucher and invoice PDFs should stream for confirmed bookings
        $this->getAuthed("/api/bookings/{$booking['id']}/voucher", $token)
            ->assertStatus(200);

        $this->getAuthed("/api/bookings/{$booking['id']}/invoice", $token)
            ->assertStatus(200);
    }

    public function test_customer_dashboard_and_wallet_endpoints(): void
    {
        $token = $this->token('customer@demo.com');

        foreach (['/api/customer/dashboard', '/api/customer/wallet', '/api/customer/loyalty', '/api/customer/coupons'] as $url) {
            $this->getAuthed($url, $token)
                ->assertStatus(200)
                ->assertJsonPath('success', true);
        }
    }

    public function test_agent_endpoints_require_agent_role(): void
    {
        $agentToken = $this->token('agent@demo.com');

        $this->getAuthed('/api/agent/dashboard', $agentToken)
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // Customers cannot access agent endpoints
        $customerToken = $this->token('customer@demo.com');
        $this->getAuthed('/api/agent/dashboard', $customerToken)
            ->assertStatus(403);
    }

    public function test_admin_endpoints_require_admin_role(): void
    {
        $adminToken = $this->token('admin@demo.com');

        $this->getAuthed('/api/admin/dashboard', $adminToken)
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->getAuthed('/api/admin/audit-logs', $adminToken)
            ->assertStatus(200);

        // Agents cannot access admin endpoints
        $agentToken = $this->token('agent@demo.com');
        $this->getAuthed('/api/admin/dashboard', $agentToken)
            ->assertStatus(403);
    }
}
