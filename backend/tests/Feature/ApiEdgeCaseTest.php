<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Edge-case and abuse-case coverage:
 * validation failures, malformed input, boundary values, authorization
 * failures, token handling, and payment state-machine violations.
 */
class ApiEdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    protected string $customerToken = '';
    protected string $agentToken = '';
    protected string $adminToken = '';

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('db:seed', ['--force' => true]);

        $this->customerToken = $this->login('customer@demo.com');
        $this->agentToken = $this->login('agent@demo.com');
        $this->adminToken = $this->login('admin@demo.com');
    }

    protected function login(string $email): string
    {
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

    protected function getAuthed(string $url, string $token)
    {
        $this->app['auth']->forgetGuards();
        return $this->getJson($url, $this->authed($token));
    }

    protected function postAuthed(string $url, array $data, string $token)
    {
        $this->app['auth']->forgetGuards();
        return $this->postJson($url, $data, $this->authed($token));
    }

    // ------------------------------------------------------------------
    // Authentication edge cases
    // ------------------------------------------------------------------

    public function test_login_rejects_wrong_password(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'customer@demo.com', 'password' => 'wrong'])
            ->assertStatus(401)
            ->assertJsonMissing(['token']);
    }

    public function test_login_rejects_unknown_email(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'ghost@nowhere.test', 'password' => 'password'])
            ->assertStatus(401);
    }

    public function test_login_rejects_malformed_email(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'not-an-email', 'password' => 'password'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        $payload = [
            'name' => 'Dup Test',
            'email' => 'customer@demo.com',
            'password' => 'secret12345',
            'password_confirmation' => 'secret12345',
        ];
        $this->postJson('/api/auth/register', $payload)->assertStatus(422);
    }

    public function test_registration_rejects_mismatched_password_confirmation(): void
    {
        $payload = [
            'name' => 'Mismatch',
            'email' => 'mismatch@test.local',
            'password' => 'secret12345',
            'password_confirmation' => 'different999',
        ];
        $this->postJson('/api/auth/register', $payload)->assertStatus(422);
    }

    public function test_me_fails_with_garbage_token(): void
    {
        $this->getJson('/api/auth/me', $this->authed('99|totally-invalid-token-signature'))
            ->assertStatus(401);
    }

    public function test_me_fails_without_token(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_logout_invalidates_the_session_token(): void
    {
        $token = $this->login('customer@demo.com');

        $this->postJson('/api/auth/logout', [], $this->authed($token))
            ->assertStatus(200);

        $tokenId = explode('|', $token)[0];
        \$row = \Laravel\Sanctum\PersonalAccessToken::find(\$tokenId);
        fwrite(STDERR, "\nDEBUG: token row after logout: " . (\$row ? 'STILL EXISTS' : 'deleted') . "\n");

        // The token must no longer authenticate
        $this->getJson('/api/auth/me', $this->authed($token))->assertStatus(401);
    }

    // ------------------------------------------------------------------
    // Search validation edge cases (the exact shapes the SPA can send)
    // ------------------------------------------------------------------

    public function test_search_rejects_past_dates(): void
    {
        $past = now()->subDays(5)->toDateString();

        $this->getJson("/api/search/hotels?destination=Dubai&check_in={$past}&check_out=" . now()->addDays(3)->toDateString())
            ->assertStatus(422);

        $this->getJson('/api/search/buses?origin=Delhi&destination=Jaipur&journey_date=' . $past)
            ->assertStatus(422);
    }

    public function test_search_rejects_check_out_before_check_in(): void
    {
        $this->getJson('/api/search/hotels?destination=Dubai&check_in=' . now()->addDays(5)->toDateString() . '&check_out=' . now()->addDays(2)->toDateString())
            ->assertStatus(422);
    }

    public function test_search_rejects_out_of_range_pagination(): void
    {
        $date = now()->addDays(3)->toDateString();

        $this->getJson("/api/search/buses?origin=Delhi&destination=Jaipur&journey_date={$date}&page=0")
            ->assertStatus(422);
        $this->getJson("/api/search/buses?origin=Delhi&destination=Jaipur&journey_date={$date}&per_page=999")
            ->assertStatus(422);
        $this->getJson("/api/search/buses?origin=Delhi&destination=Jaipur&journey_date={$date}&sort=nonsense")
            ->assertStatus(422);
    }

    public function test_search_accepts_every_sort_value_the_frontend_sends(): void
    {
        $date = now()->addDays(3)->toDateString();

        $matrix = [
            '/api/search/hotels?destination=Dubai&check_in=' . now()->addDays(7)->toDateString() . '&check_out=' . now()->addDays(10)->toDateString()
                => ['recommended', 'price_low', 'price_high', 'rating', 'distance'],
            '/api/search/flights?origin=DEL&destination=BOM&departure_date=' . $date
                => ['recommended', 'cheapest', 'fastest', 'earliest', 'latest'],
            '/api/search/trains?origin=Delhi&destination=Mumbai&journey_date=' . $date
                => ['recommended', 'cheapest', 'fastest', 'earliest', 'latest'],
            '/api/search/buses?origin=Delhi&destination=Jaipur&journey_date=' . $date
                => ['recommended', 'cheapest', 'fastest', 'earliest', 'latest'],
            '/api/search/venues?city=Dubai&event_date=' . now()->addDays(14)->toDateString()
                => ['recommended', 'price_low', 'price_high', 'rating', 'capacity'],
            '/api/search/cars?city_id=1&pickup_date=' . $date . '&return_date=' . now()->addDays(6)->toDateString()
                => ['recommended', 'price_low', 'price_high', 'rating'],
            '/api/search/activities?city=Dubai&date=' . $date
                => ['recommended', 'price_low', 'price_high', 'rating', 'duration'],
            '/api/search/transfers?city=Dubai&date=' . $date
                => ['recommended', 'price_low', 'price_high', 'rating', 'fastest'],
            '/api/search/packages?destination=Bali'
                => ['recommended', 'price_low', 'price_high', 'rating', 'duration'],
        ];

        foreach ($matrix as $url => $sorts) {
            foreach ($sorts as $sort) {
                $this->getJson($url . '&sort=' . $sort)
                    ->assertStatus(200)
                    ->assertJsonPath('success', true);
            }
        }
    }

    public function test_search_accepts_multi_value_filter_lists(): void
    {
        // The SPA sends comma-separated selections for these filters
        $date = now()->addDays(3)->toDateString();

        $this->getJson('/api/search/hotels?destination=Dubai&check_in=' . now()->addDays(7)->toDateString() . '&check_out=' . now()->addDays(10)->toDateString() . '&star_rating=4,5')
            ->assertStatus(200);

        $this->getJson('/api/search/flights?origin=DEL&destination=BOM&departure_date=' . $date . '&cabin_class=economy,business&stops=0,1')
            ->assertStatus(200);

        $this->getJson('/api/search/hotels?destination=Dubai&check_in=' . now()->addDays(7)->toDateString() . '&check_out=' . now()->addDays(10)->toDateString() . '&amenities=' . urlencode('Free WiFi,Spa'))
            ->assertStatus(200);
    }

    public function test_search_rejects_non_numeric_counts(): void
    {
        $date = now()->addDays(3)->toDateString();

        $this->getJson("/api/search/buses?origin=Delhi&destination=Jaipur&journey_date={$date}&passengers=abc")
            ->assertStatus(422);
        $this->getJson("/api/search/buses?origin=Delhi&destination=Jaipur&journey_date={$date}&passengers=99")
            ->assertStatus(422);
    }

    public function test_car_search_resolves_pickup_locations_by_city(): void
    {
        $response = $this->getJson('/api/search/cars?city_id=1&pickup_date=' . now()->addDays(3)->toDateString() . '&return_date=' . now()->addDays(6)->toDateString());

        $response->assertStatus(200)->assertJsonPath('success', true);

        // Delhi has a seeded pickup location, so demo cars must be returned
        $this->assertNotEmpty($response->json('data.results'), 'Car search with a valid city filter must return results');
    }

    public function test_search_handles_unicode_and_html_input_safely(): void
    {
        $date = now()->addDays(3)->toDateString();

        $response = $this->getJson('/api/search/hotels?destination=' . urlencode('<script>alert(1)</script>') . '&check_in=' . now()->addDays(7)->toDateString() . '&check_out=' . now()->addDays(10)->toDateString());
        $response->assertStatus(200);

        $body = $response->getContent();
        $this->assertStringNotContainsString('<script>', $body, 'Reflected script input must be escaped');
    }

    // ------------------------------------------------------------------
    // Booking edge cases
    // ------------------------------------------------------------------

    protected function createBooking(string $token, array $overrides = [])
    {
        $payload = array_merge([
            'items' => [[
                'item_type' => 'hotel',
                'service_id' => 1,
                'configuration' => [
                    'rooms' => 1,
                    'check_in' => now()->addDays(7)->toDateString(),
                    'check_out' => now()->addDays(10)->toDateString(),
                ],
                'travelers' => [[
                    'first_name' => 'Edge',
                    'last_name' => 'Case',
                    'email' => 'edge@case.test',
                ]],
            ]],
            'currency' => 'INR',
        ], $overrides);

        return $this->postAuthed('/api/bookings', $payload, $token);
    }

    public function test_booking_requires_authentication(): void
    {
        $this->postJson('/api/bookings', ['items' => []])->assertStatus(401);
    }

    public function test_booking_rejects_empty_items(): void
    {
        $this->createBooking($this->customerToken, ['items' => []])
            ->assertStatus(422);
    }

    public function test_booking_rejects_unknown_service_type(): void
    {
        $this->createBooking($this->customerToken, [
            'items' => [[
                'item_type' => 'spaceship',
                'service_id' => 1,
                'configuration' => [],
                'travelers' => [['first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.test']],
            ]],
        ])->assertStatus(422);
    }

    public function test_booking_rejects_nonexistent_service_id(): void
    {
        // service_id 999999 does not resolve on any demo provider
        $this->createBooking($this->customerToken, [
            'items' => [[
                'item_type' => 'hotel',
                'service_id' => 999999,
                'configuration' => ['check_in' => now()->addDays(3)->toDateString(), 'check_out' => now()->addDays(5)->toDateString()],
                'travelers' => [['first_name' => 'A', 'last_name' => 'B', 'email' => 'a@b.test']],
            ]],
        ])->assertStatus(500);
    }

    public function test_booking_rejects_travelers_without_required_fields(): void
    {
        $this->createBooking($this->customerToken, [
            'items' => [[
                'item_type' => 'hotel',
                'service_id' => 1,
                'configuration' => ['check_in' => now()->addDays(3)->toDateString(), 'check_out' => now()->addDays(5)->toDateString()],
                'travelers' => [['first_name' => 'OnlyFirst']],
            ]],
        ])->assertStatus(422);
    }

    public function test_customer_cannot_read_another_customers_booking(): void
    {
        // Create booking as customer, then read it as agent-turned-customer is
        // blocked by the authorization check inside show()
        $booking = $this->createBooking($this->customerToken, []);
        $booking->assertStatus(201);
        $id = $booking->json('data.id');

        // Another customer must not see it
        $otherToken = $this->login('priya@demo.com');
        $this->getAuthed("/api/bookings/{$id}", $otherToken)->assertStatus(403);
    }

    public function test_booking_pricing_is_recomputed_server_side(): void
    {
        // The client does not send prices — the server must derive them.
        $response = $this->createBooking($this->customerToken, []);
        $response->assertStatus(201);

        $booking = $response->json('data');
        $this->assertGreaterThan(0, (float) $booking['grand_total']);
        $this->assertArrayNotHasKey('grand_total', $booking['items'][0] ?? [], 'Client cannot dictate totals');
    }

    // ------------------------------------------------------------------
    // Payment edge cases
    // ------------------------------------------------------------------

    public function test_payment_cannot_be_processed_twice(): void
    {
        $token = $this->customerToken;
        $booking = $this->createBooking($token, []);
        $booking->assertStatus(201);
        $bookingId = $booking->json('data.id');

        $initiate = $this->postAuthed('/api/payments/initiate', [
            'booking_id' => $bookingId,
            'payment_method_id' => 1,
        ], $token);
        $initiate->assertStatus(201);
        $paymentId = $initiate->json('data.id');

        $this->postAuthed("/api/payments/{$paymentId}/process", [], $token)->assertStatus(200);

        // Second process attempt must be rejected (payment no longer pending)
        $this->postAuthed("/api/payments/{$paymentId}/process", [], $token)->assertStatus(422);
    }

    public function test_payment_requires_matching_customer(): void
    {
        $booking = $this->createBooking($this->customerToken, []);
        $booking->assertStatus(201);
        $bookingId = $booking->json('data.id');

        // A different customer cannot initiate payment on someone else's booking
        $otherToken = $this->login('priya@demo.com');
        $this->postAuthed('/api/payments/initiate', [
            'booking_id' => $bookingId,
            'payment_method_id' => 1,
        ], $otherToken)->assertStatus(403);
    }

    public function test_payment_rejects_unknown_booking_or_method(): void
    {
        $this->postAuthed('/api/payments/initiate', [
            'booking_id' => 999999,
            'payment_method_id' => 1,
        ], $this->customerToken)->assertStatus(422);

        $this->postAuthed('/api/payments/initiate', [
            'booking_id' => 1,
            'payment_method_id' => 999999,
        ], $this->customerToken)->assertStatus(422);
    }

    public function test_initiating_payment_twice_does_not_double_charge(): void
    {
        $token = $this->customerToken;
        $booking = $this->createBooking($token, []);
        $bookingId = $booking->json('data.id');

        $first = $this->postAuthed('/api/payments/initiate', [
            'booking_id' => $bookingId,
            'payment_method_id' => 1,
        ], $token);
        $first->assertStatus(201);

        $paymentId = $first->json('data.id');

        // Processing the first payment captures it
        $this->postAuthed("/api/payments/{$paymentId}/process", [], $token)->assertStatus(200);

        // The outstanding amount must now be zero — a second initiate cannot charge again
        $second = $this->postAuthed('/api/payments/initiate', [
            'booking_id' => $bookingId,
            'payment_method_id' => 1,
        ], $token);
        $this->assertTrue(in_array($second->status(), [422, 500]), 'Second initiation must be rejected once fully paid');
    }

    // ------------------------------------------------------------------
    // Role boundary checks
    // ------------------------------------------------------------------

    public function test_role_boundaries_are_enforced_across_all_groups(): void
    {
        // Customer cannot reach agent or admin areas
        $this->getAuthed('/api/agent/dashboard', $this->customerToken)->assertStatus(403);
        $this->getAuthed('/api/admin/dashboard', $this->customerToken)->assertStatus(403);

        // Agent cannot reach admin areas
        $this->getAuthed('/api/admin/dashboard', $this->agentToken)->assertStatus(403);

        // Admin can reach everything
        $this->getAuthed('/api/admin/dashboard', $this->adminToken)->assertStatus(200);
        $this->getAuthed('/api/agent/dashboard', $this->adminToken)->assertStatus(200);
    }

    public function test_unauthenticated_requests_to_protected_groups_are_rejected(): void
    {
        $this->getJson('/api/bookings')->assertStatus(401);
        $this->getJson('/api/customer/dashboard')->assertStatus(401);
        $this->getJson('/api/agent/dashboard')->assertStatus(401);
        $this->getJson('/api/admin/dashboard')->assertStatus(401);
    }

    // ------------------------------------------------------------------
    // Promotions
    // ------------------------------------------------------------------

    public function test_promo_validation_rejects_unknown_codes(): void
    {
        // Unknown codes fail validation (the controller rules only allow active, in-window codes)
        $this->postJson('/api/promotions/validate', ['code' => 'NOPE-404', 'cart_total' => 5000])
            ->assertStatus(422);
    }

    public function test_promo_validation_requires_amount(): void
    {
        $this->postJson('/api/promotions/validate', ['code' => 'WELCOME10'])
            ->assertStatus(422);
    }
}
