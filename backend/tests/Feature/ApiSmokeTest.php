<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * End-to-end API smoke tests.
 *
 * These exercise the public search surface, the auth lifecycle, the
 * booking -> payment -> confirmation pipeline, and the PDF downloads
 * against the seeded demo providers. Run with a fresh database:
 *
 *   php artisan migrate:fresh --seed --env=testing && php artisan test
 */
class ApiSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected string $customerToken = '';
    protected string $agentToken = '';
    protected string $adminToken = '';

    protected function setUp(): void
    {
        parent::setUp();

        // Seed the database once for the suite
        $this->artisan('db:seed', ['--force' => true]);

        $this->customerToken = $this->login('customer@demo.com');
        $this->agentToken = $this->login('agent@demo.com');
        $this->adminToken = $this->login('admin@demo.com');
    }

    protected function login(string $email): string
    {
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
        $this->getJson('/api/auth/me', $this->authed($this->customerToken))
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
        // Create a booking for a hotel room
        $create = $this->postJson('/api/bookings', [
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
        ], $this->authed($this->customerToken));

        $create->assertStatus(201)->assertJsonPath('success', true);

        $booking = $create->json('data');
        $this->assertNotEmpty($booking['booking_reference']);
        $this->assertGreaterThan(0, (float) $booking['grand_total'], 'grand_total should be priced');

        // Look up by reference
        $this->getJson("/api/bookings/reference/{$booking['booking_reference']}", $this->authed($this->customerToken))
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // Initiate and process payment — demo gateway captures and confirms
        $initiate = $this->postJson('/api/payments/initiate', [
            'booking_id' => $booking['id'],
            'payment_method_id' => 1,
        ], $this->authed($this->customerToken));

        $initiate->assertStatus(200)->assertJsonPath('success', true);
        $paymentId = $initiate->json('data.id');

        $process = $this->postJson("/api/payments/{$paymentId}/process", [], $this->authed($this->customerToken));
        $process->assertStatus(200)->assertJsonPath('success', true);

        // Booking should now be confirmed and paid
        $this->getJson("/api/bookings/{$booking['id']}", $this->authed($this->customerToken))
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'paid');

        // Voucher and invoice PDFs should stream for confirmed bookings
        $this->getJson("/api/bookings/{$booking['id']}/voucher", $this->authed($this->customerToken))
            ->assertStatus(200)
            ->assertHeader('Content-Type', 'application/pdf');

        $this->getJson("/api/bookings/{$booking['id']}/invoice", $this->authed($this->customerToken))
            ->assertStatus(200)
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_customer_dashboard_and_wallet_endpoints(): void
    {
        foreach (['/api/customer/dashboard', '/api/customer/wallet', '/api/customer/loyalty', '/api/customer/coupons'] as $url) {
            $this->getJson($url, $this->authed($this->customerToken))
                ->assertStatus(200)
                ->assertJsonPath('success', true);
        }
    }

    public function test_agent_endpoints_require_agent_role(): void
    {
        $this->getJson('/api/agent/dashboard', $this->authed($this->agentToken))
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // Customers cannot access agent endpoints
        $this->getJson('/api/agent/dashboard', $this->authed($this->customerToken))
            ->assertStatus(403);
    }

    public function test_admin_endpoints_require_admin_role(): void
    {
        $this->getJson('/api/admin/dashboard', $this->authed($this->adminToken))
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->getJson('/api/admin/audit-logs', $this->authed($this->adminToken))
            ->assertStatus(200);

        // Agents cannot access admin endpoints
        $this->getJson('/api/admin/dashboard', $this->authed($this->agentToken))
            ->assertStatus(403);
    }
}
