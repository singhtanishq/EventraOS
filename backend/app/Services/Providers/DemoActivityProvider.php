<?php

namespace App\Services\Providers;

use App\Models\Activity;
use App\Models\ActivityPricing;
use App\Services\Providers\DTO\{
    SearchResultCollection,
    SearchResult,
    AvailabilityResult,
    HoldResult,
    BookingConfirmation,
    CancellationResult,
    BookingStatus,
    RefundResult
};
use Illuminate\Support\Facades\DB;

class DemoActivityProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = \App\Models\Activity::query()->where('is_active', true)
            ->where('is_demo', true)
            ->with(['category', 'city', 'pricing']);

        if (!empty($criteria['city_id'])) {
            $query->where('city_id', $criteria['city_id']);
        } elseif (!empty($criteria['city'])) {
            $query->whereHas('city', fn ($q) => $q->where('name', 'like', "%{$criteria['city']}%"));
        }

        if (!empty($criteria['category_id'])) {
            $query->where('category_id', $criteria['category_id']);
        } elseif (!empty($criteria['category'])) {
            $query->whereHas('category', fn ($q) => $q->where('name', 'like', "%{$criteria['category']}%"));
        }

        if (!empty($criteria['date'])) {
            $query->whereHas('schedules', function ($q) use ($criteria) {
                $q->whereDate('start_time', '>=', $criteria['date']);
            });
        }

        if (!empty($criteria['participants'])) {
            $query->where('max_participants', '>=', $criteria['participants']);
        }

        if (!empty($criteria['price_min']) || !empty($criteria['price_max'])) {
            $query->whereHas('pricing', function ($q) use ($criteria) {
                if (!empty($criteria['price_min'])) {
                    $q->where('price', '>=', $criteria['price_min']);
                }
                if (!empty($criteria['price_max'])) {
                    $q->where('price', '<=', $criteria['price_max']);
                }
            });
        }

        $activities = \App\Models\Activity::query()
            ->where('is_active', true)
            ->where('is_demo', true)
            ->with(['category', 'city', 'pricing'])
            ->orderBy('rating', 'desc')
            ->limit(20)
            ->get();

        $results = $activities->map(function ($activity) {
            $price = $activity->pricing->min('price') ?? 0;

            return new \App\Services\Providers\DTO\SearchResult(
                id: 'activity_' . $activity->id,
                name: $activity->name,
                type: 'activity',
                providerCode: $this->getCode(),
                providerItemId: (string) $activity->id,
                location: [
                    'city' => $activity->city->name ?? '',
                    'country' => $activity->city->country->name ?? '',
                    'address' => $activity->address,
                    'latitude' => $activity->latitude,
                    'longitude' => $activity->longitude,
                ],
                pricing: [
                    'base_price' => (float) $activity->pricing->min('price') ?? 0,
                    'currency' => 'INR',
                    'per_person' => $activity->pricing->min('price') ?? 0,
                ],
                availability: [
                    'available' => $activity->schedules()->where('is_active', true)->exists(),
                    'slots_available' => $activity->schedules()->where('is_active', true)->sum('max_participants'),
                ],
                images: $activity->images ?? [],
                amenities: $activity->inclusions ?? [],
                metadata: [
                    'duration_minutes' => $activity->duration_minutes,
                    'duration_type' => $activity->duration_type,
                    'min_participants' => $activity->min_participants,
                    'max_participants' => $activity->max_participants,
                    'is_private' => $activity->is_private,
                    'has_guide' => $activity->has_guide,
                    'guide_languages' => $activity->guide_languages ?? [],
                    'is_wheelchair_accessible' => $activity->is_wheelchair_accessible,
                    'is_private' => $activity->is_private,
                    'is_featured' => $activity->is_featured,
                    'rating' => $activity->rating,
                    'review_count' => $activity->review_count,
                ],
                rating: $activity->rating ?? 0,
                reviewCount: $activity->review_count ?? 0,
            );
        })->toArray();

        return new SearchResultCollection($results, $activities->count(), $this->getCode());
    }

    public function getDetails(string $itemId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        $activity = \App\Models\Activity::with(['category', 'city', 'pricing', 'schedules'])->find($itemId);
        if (! $activity) return null;

        return new \App\Services\Providers\DTO\ProviderItemDetails(
            id: (string) $itemId,
            name: $this->name,
            description: $this->description,
            images: $this->images ?? [],
            location: [
                'address' => $this->address,
                'city' => $this->city->name ?? '',
                'country' => $this->city->country->name ?? '',
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
            ],
            amenities: $this->inclusions ?? [],
            pricing: [
                'currency' => 'INR',
                'options' => $this->pricing->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'price' => (float) $p->price,
                    'currency' => $p->currency,
                    'participant_type' => $p->participant_type,
                ])->toArray(),
            ],
            policies: [
                'cancellation' => $this->cancellation_policy,
                'requirements' => $this->requirements ?? [],
                'what_to_bring' => $this->what_to_bring ?? [],
            ],
            availability: [
                'schedule' => $this->schedules->map(fn ($s) => [
                    'name' => $s->name,
                    'start_time' => $s->start_time,
                    'end_time' => $s->end_time,
                    'days_of_week' => $s->days_of_week,
                ])->toArray(),
            ],
            metadata: [
                'duration_minutes' => $this->duration_minutes,
                'duration_type' => $this->duration_type,
                'min_participants' => $this->min_participants,
                'max_participants' => $this->max_participants,
                'is_private' => $this->is_private,
                'has_guide' => $this->has_guide,
                'guide_languages' => $this->guide_languages ?? [],
                'is_wheelchair_accessible' => $this->is_wheelchair_accessible,
                'is_private' => $this->is_private,
            ],
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $activity = \App\Models\Activity::find($itemId);
        if (! $activity) return new AvailabilityResult(false, 0, 0, 'INR');

        $available = $activity->schedules()->where('is_active', true)->exists();
        $price = $activity->pricing->min('price') ?? 0;

        return new AvailabilityResult(
            available: $available,
            availableQuantity: 20,
            price: $price,
            currency: 'INR'
        );
    }

    public function createHold(array $bookingData): HoldResult
    {
        $ref = 'HOLD-' . strtoupper(\Illuminate\Support\Str::random(10));
        return new HoldResult($ref, now()->addMinutes(15), $bookingData['items'] ?? []);
    }

    public function confirmBooking(string $holdReference, array $bookingData): BookingConfirmation
    {
        return new BookingConfirmation(
            bookingReference: $bookingData['booking_reference'] ?? 'EVR-' . strtoupper(\Illuminate\Support\Str::random(6)),
            providerReference: 'DEMO-' . strtoupper(\Illuminate\Support\Str::random(8)),
            confirmationDetails: ['provider' => $this->getCode(), 'confirmed_at' => now()->toISOString()],
            successful: true
        );
    }

    public function cancelBooking(string $bookingReference, array $options = []): CancellationResult
    {
        return new CancellationResult(true, $options['refund_amount'] ?? 0, $options['cancellation_fee'] ?? 0);
    }

    public function getBookingStatus(string $bookingReference): BookingStatus
    {
        return new BookingStatus('confirmed', 'confirmed', []);
    }

    public function processRefund(string $bookingReference, float $amount, string $reason): RefundResult
    {
        return new RefundResult(true, 'REF-' . strtoupper(\Illuminate\Support\Str::random(8)), $amount);
    }
}
