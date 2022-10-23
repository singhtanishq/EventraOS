<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Notification;
use App\Models\Review;
use App\Models\SupportTicket;
use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    private function customer(Request $request)
    {
        $customer = $request->user()->customer;
        abort_unless($customer, 404, 'Customer profile not found.');
        return $customer;
    }

    public function dashboard(Request $request): JsonResponse
    {
        $customer = $this->customer($request);

        $stats = [
            'upcoming_trips' => $customer->bookings()
                ->whereIn('status', ['confirmed', 'partially_confirmed', 'payment_pending'])
                ->whereHas('items', fn ($q) => $q->where('service_date', '>=', now()))
                ->count(),
            'total_bookings' => $customer->bookings()->count(),
            'total_spent' => (float) $customer->bookings()->where('payment_status', 'paid')->sum('grand_total'),
            'wallet_balance' => (float) ($customer->wallet?->balance ?? 0),
            'loyalty_points' => (int) ($customer->loyaltyAccount?->points_balance ?? 0),
            'pending_reviews' => $customer->bookings()
                ->where('status', 'completed')
                ->whereDoesntHave('reviews')
                ->count(),
        ];

        $upcomingTrips = Booking::with('items')
            ->where('customer_id', $customer->id)
            ->whereIn('status', ['confirmed', 'partially_confirmed', 'payment_pending'])
            ->whereHas('items', fn ($q) => $q->where('service_date', '>=', now()))
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'booking_reference' => $b->booking_reference,
                'type' => $b->items->first()?->item_type ?? 'package',
                'name' => $b->items->first()?->service_name ?? 'Trip',
                'start_date' => $b->items->first()?->service_date?->toDateString(),
                'end_date' => $b->items->first()?->service_end_date?->toDateString(),
                'status' => $b->status,
                'travelers' => $b->items->sum(fn ($i) => count($i->travelers ?? [])) ?: 1,
                'location' => ['city' => '—', 'country' => '—'],
            ]);

        $recentBookings = Booking::with('items')
            ->where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'booking_reference' => $b->booking_reference,
                'type' => $b->items->first()?->item_type ?? 'package',
                'name' => $b->items->first()?->service_name ?? 'Booking',
                'date' => $b->created_at->toDateString(),
                'amount' => (float) $b->grand_total,
                'currency' => $b->currency,
                'status' => $b->status,
            ]);

        $notifications = Notification::where('notifiable_type', \App\Models\User::class)
            ->where('notifiable_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'is_read' => $n->is_read,
                'created_at' => $n->created_at->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'upcoming_trips' => $upcomingTrips,
                'recent_bookings' => $recentBookings,
                'notifications' => $notifications,
                'favorites' => [],
            ],
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $customer = $this->customer($request)->load('user');
        return response()->json(['success' => true, 'data' => $customer]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $customer = $this->customer($request);

        $validated = $request->validate([
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female,other,prefer_not_to_say',
            'nationality' => 'nullable|string|max:2',
            'passport_number' => 'nullable|string|max:50',
            'passport_expiry' => 'nullable|date|after:today',
            'address' => 'nullable|array',
            'travel_preferences' => 'nullable|array',
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
        ]);

        DB::transaction(function () use ($customer, $validated) {
            if (isset($validated['name']) || array_key_exists('phone', $validated)) {
                $customer->user->update(array_filter([
                    'name' => $validated['name'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                ], fn ($v) => $v !== null));
            }

            $customer->update(collect($validated)->except(['name', 'phone'])->all());
        });

        return response()->json([
            'success' => true,
            'message' => 'Profile updated.',
            'data' => $customer->fresh()->load('user'),
        ]);
    }

    public function trips(Request $request): JsonResponse
    {
        $customer = $this->customer($request);

        $query = Booking::with('items')
            ->where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc');

        if ($filter = $request->query('filter')) {
            match ($filter) {
                'upcoming' => $query->whereIn('status', ['confirmed', 'partially_confirmed', 'payment_pending'])
                    ->whereHas('items', fn ($q) => $q->where('service_date', '>=', now())),
                'completed' => $query->where('status', 'completed'),
                'cancelled' => $query->whereIn('status', ['cancelled', 'cancel_requested']),
                'pending' => $query->whereIn('status', ['draft', 'held', 'payment_pending', 'payment_processing']),
                default => null,
            };
        }

        if ($type = $request->query('type')) {
            if ($type !== 'all') {
                $query->whereHas('items', fn ($q) => $q->where('item_type', $type));
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('booking_reference', 'like', "%{$search}%")
                  ->orWhereHas('items', fn ($iq) => $iq->where('service_name', 'like', "%{$search}%"));
            });
        }

        $bookings = $query->paginate($request->integer('per_page', 15));

        $trips = collect($bookings->items())->map(fn ($b) => [
            'id' => $b->id,
            'booking_reference' => $b->booking_reference,
            'type' => $b->items->first()?->item_type ?? 'package',
            'name' => $b->items->first()?->service_name ?? 'Booking',
            'start_date' => $b->items->first()?->service_date?->toDateString(),
            'end_date' => $b->items->first()?->service_end_date?->toDateString(),
            'status' => $b->status,
            'amount' => (float) $b->grand_total,
            'currency' => $b->currency,
            'travelers' => $b->items->sum(fn ($i) => count($i->travelers ?? [])) ?: 1,
            'location' => ['city' => '—', 'country' => '—'],
        ]);

        return response()->json([
            'success' => true,
            'data' => ['trips' => $trips, 'total_count' => $bookings->total()],
        ]);
    }

    public function wallet(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $wallet = $customer->wallet()->firstOrCreate(['customer_id' => $customer->id], ['currency' => 'INR']);

        $transactions = $wallet->transactions()->orderBy('created_at', 'desc')->limit(50)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'wallet' => [
                    'balance' => (float) $wallet->balance,
                    'pending_balance' => (float) $wallet->pending_balance,
                    'blocked_balance' => (float) $wallet->blocked_balance,
                    'currency' => $wallet->currency,
                ],
                'transactions' => $transactions,
            ],
        ]);
    }

    public function loyalty(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $account = $customer->loyaltyAccount()->firstOrCreate(['customer_id' => $customer->id]);

        $transactions = $account->transactions()->orderBy('created_at', 'desc')->limit(50)->get();
        $tiers = ['bronze' => 0, 'silver' => 5000, 'gold' => 20000, 'platinum' => 50000];
        $currentPoints = $account->points_lifetime_earned;
        $nextTier = collect($tiers)->first(fn ($threshold, $tier) => $currentPoints < $threshold && $tier !== 'bronze');

        return response()->json([
            'success' => true,
            'data' => [
                'account' => [
                    'tier' => $account->tier,
                    'points_balance' => (int) $account->points_balance,
                    'points_pending' => (int) $account->points_pending,
                    'points_lifetime_earned' => (int) $account->points_lifetime_earned,
                    'points_lifetime_redeemed' => (int) $account->points_lifetime_redeemed,
                    'next_tier' => $nextTier ?? 'platinum',
                    'points_to_next_tier' => $nextTier ? max(0, ($tiers[$nextTier] ?? 0) - $currentPoints) : 0,
                    'tier_benefits' => [],
                ],
                'transactions' => $transactions,
            ],
        ]);
    }

    public function coupons(Request $request): JsonResponse
    {
        $customer = $this->customer($request);

        $promotions = \App\Models\Promotion::where('is_active', true)
            ->where('valid_from', '<=', now())
            ->where('valid_to', '>=', now())
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->promo_code ?? $p->slug,
                'promotion' => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'type' => $p->type,
                    'value' => (float) $p->value,
                    'currency' => $p->currency,
                    'applicable_to' => $p->applicable_to,
                    'description' => $p->description,
                    'valid_from' => $p->valid_from->toDateString(),
                    'valid_to' => $p->valid_to->toDateString(),
                    'min_booking_value' => $p->min_booking_value,
                    'max_discount_amount' => $p->max_discount_amount !== null ? (float) $p->max_discount_amount : null,
                ],
                'status' => 'active',
                'expires_at' => $p->valid_to->endOfDay()->toISOString(),
            ]);

        return response()->json(['success' => true, 'data' => ['coupons' => $promotions]]);
    }

    public function favorites(Request $request): JsonResponse
    {
        $customer = $this->customer($request);
        $favorites = $customer->favorites()->with('favoritable')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'favorites' => $favorites->map(fn ($f) => [
                    'id' => $f->id,
                    'uuid' => $f->favoritable?->uuid,
                    'favoritable_type' => $f->favoritable_type,
                    'name' => $f->favoritable?->name ?? 'Unknown',
                    'image' => $f->favoritable?->images[0] ?? null,
                    'location' => ['city' => $f->favoritable?->city?->name ?? '—', 'country' => $f->favoritable?->city?->country?->name ?? '—'],
                    'price' => 0,
                    'currency' => 'INR',
                    'metadata' => ['rating' => $f->favoritable?->rating],
                ]),
            ],
        ]);
    }

    public function addFavorite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'favoritable_type' => 'required|in:hotel,venue,activity,package',
            'favoritable_id' => 'required|integer',
        ]);

        $modelClass = match ($validated['favoritable_type']) {
            'hotel' => \App\Models\Hotel::class,
            'venue' => \App\Models\Venue::class,
            'activity' => \App\Models\Activity::class,
            'package' => \App\Models\TravelPackage::class,
        };

        $model = $modelClass::findOrFail($validated['favoritable_id']);

        $favorite = $this->customer($request)->favorites()->firstOrCreate([
            'favoritable_type' => $modelClass,
            'favoritable_id' => $model->id,
        ]);

        return response()->json(['success' => true, 'message' => 'Added to favorites.', 'data' => $favorite], 201);
    }

    public function removeFavorite(Request $request, Favorite $favorite): JsonResponse
    {
        abort_unless($favorite->customer_id === $this->customer($request)->id, 403);
        $favorite->delete();
        return response()->json(['success' => true, 'message' => 'Removed from favorites.']);
    }

    public function reviews(Request $request): JsonResponse
    {
        $reviews = $this->customer($request)->reviews()->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => ['reviews' => $reviews]]);
    }

    public function createReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => 'required|integer|exists:bookings,id',
            'overall_rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'nullable|string|max:5000',
            'ratings' => 'nullable|array',
        ]);

        $customer = $this->customer($request);
        $booking = Booking::where('customer_id', $customer->id)->findOrFail($validated['booking_id']);

        abort_unless($booking->status === 'completed', 422, 'Only completed bookings can be reviewed.');

        abort_if(Review::where('booking_id', $booking->id)->where('customer_id', $customer->id)->exists(),
            422, 'You have already reviewed this booking.');

        $item = $booking->items()->first();

        $review = Review::create([
            'customer_id' => $customer->id,
            'booking_id' => $booking->id,
            'booking_item_id' => $item?->id,
            'service_type' => $item?->item_type ?? 'package',
            'service_id' => $item?->service_id,
            'overall_rating' => $validated['overall_rating'],
            'ratings' => $validated['ratings'] ?? [],
            'title' => $validated['title'] ?? null,
            'comment' => $validated['comment'] ?? null,
            'status' => 'published',
        ]);

        return response()->json(['success' => true, 'message' => 'Review submitted.', 'data' => $review], 201);
    }

    public function supportTickets(Request $request): JsonResponse
    {
        $tickets = $this->customer($request)->supportTickets()->with('booking')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => ['tickets' => $tickets]]);
    }

    public function createSupportTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'category' => 'required|in:booking,payment,refund,cancellation,reschedule,service_quality,technical,account,general,complaint,feedback',
            'priority' => 'sometimes|in:low,normal,high,urgent',
            'booking_id' => 'nullable|integer|exists:bookings,id',
        ]);

        $customer = $this->customer($request);

        $ticket = SupportTicket::create([
            'customer_id' => $customer->id,
            'booking_id' => $validated['booking_id'] ?? null,
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'priority' => $validated['priority'] ?? 'normal',
        ]);

        return response()->json(['success' => true, 'message' => 'Ticket created.', 'data' => $ticket], 201);
    }

    public function notifications(Request $request): JsonResponse
    {
        $notifications = Notification::where('notifiable_type', \App\Models\User::class)
            ->where('notifiable_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => collect($notifications->items()),
                'total_count' => $notifications->total(),
                'unread_count' => Notification::where('notifiable_type', \App\Models\User::class)
                    ->where('notifiable_id', $request->user()->id)->where('is_read', false)->count(),
            ],
        ]);
    }

    public function markNotificationRead(Request $request, Notification $notification): JsonResponse
    {
        abort_unless($notification->notifiable_id === $request->user()->id, 403);
        $notification->update(['is_read' => true, 'read_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function markAllNotificationsRead(Request $request): JsonResponse
    {
        Notification::where('notifiable_type', \App\Models\User::class)
            ->where('notifiable_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function security(Request $request): JsonResponse
    {
        $user = $request->user();
        $sessions = $user->tokens()->where('name', 'api-token')->get()->map(fn ($t) => [
            'id' => $t->id,
            'device' => $t->name === 'api-token' ? 'Web Browser' : 'Unknown',
            'browser' => 'Unknown',
            'os' => 'Unknown',
            'ip' => '—',
            'location' => '—',
            'is_current' => $t->id === $request->user()->currentAccessToken()?->id,
            'last_active' => $t->last_used_at?->toISOString() ?? $t->created_at->toISOString(),
            'created_at' => $t->created_at->toISOString(),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'sessions' => $sessions,
                'security_events' => [],
                'login_history' => [],
                'two_factor_enabled' => (bool) $user->two_factor_enabled,
                'password_last_changed' => null,
            ],
        ]);
    }
}
