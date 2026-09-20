<?php

namespace App\Services\Providers;

use App\Models\Venue;
use App\Models\VenuePackage;
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

class DemoVenueProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = Venue::query()->where('is_active', true)
            ->where('is_demo', true);

        if (!empty($criteria['city_id'])) {
            $query->where('city_id', $criteria['city_id']);
        } elseif (!empty($criteria['city'])) {
            $query->whereHas('city', fn ($q) => $q->where('name', 'like', "%{$criteria['city']}%"));
        }

        if (!empty($criteria['event_date'])) {
            $query->whereHas('availability', function ($q) use ($criteria) {
                $q->where('date', $criteria['event_date'])
                    ->where('status', 'available');
            });
        }

        if (!empty($criteria['guest_count'])) {
            $query->where('total_capacity', '>=', $criteria['guest_count']);
        }

        if (!empty($criteria['venue_types'])) {
            $types = is_array($criteria['venue_types']) ? $criteria['venue_types'] : [$criteria['venue_types']];
            $query->where(function ($q) use ($types) {
                foreach ($types as $type) {
                    $q->orWhereJsonContains('venue_types', $type);
                }
            });
        }

        if (!empty($criteria['price_min']) || !empty($criteria['price_max'])) {
            $query->whereHas('packages', function ($q) use ($criteria) {
                if (!empty($criteria['price_min'])) {
                    $q->whereRaw('COALESCE(price_per_guest, fixed_price, price_per_hour * ?) >= ?', [24, $criteria['price_min']]);
                }
                if (!empty($criteria['price_max'])) {
                    $q->whereRaw('COALESCE(price_per_guest, fixed_price, price_per_hour * ?) <= ?', [24, $criteria['price_max']]);
                }
            });
        }

        $venues = $query->with(['city', 'packages'])->orderBy('rating', 'desc')->limit(20)->get();

        $results = $venues->map(function ($venue) {
            $minPrice = $venue->packages->min('price_per_guest') ?? 
                       $venue->packages->min('fixed_price') ?? 
                       ($venue->packages->min('price_per_hour') * 24) ?? 0;

            return new SearchResult(
                id: 'venue_' . $venue->id,
                name: $venue->name,
                type: 'venue',
                providerCode: $this->getCode(),
                providerItemId: (string) $venue->id,
                location: [
                    'city' => $venue->city->name ?? '',
                    'country' => $venue->city->country->name ?? '',
                    'address' => $venue->address,
                    'latitude' => $venue->latitude,
                    'longitude' => $venue->longitude,
                ],
                pricing: [
                    'base_price' => (float) $minPrice,
                    'currency' => 'INR',
                    'per_guest' => $minPrice > 0 ? (float) $minPrice : null,
                ],
                availability: [
                    'available' => $venue->availability()->where('status', 'available')->exists(),
                    'rooms_available' => $venue->rooms()->where('is_active', true)->sum('capacity_theater'),
                ],
                images: $venue->images ?? [],
                amenities: $venue->amenities ?? [],
                metadata: [
                    'capacity' => $venue->total_capacity,
                    'venue_types' => $venue->venue_types,
                    'rating' => $venue->rating,
                    'review_count' => $venue->review_count,
                ],
                rating: $venue->rating ?? 0,
                reviewCount: $venue->review_count ?? 0,
            );
        })->toArray();

        return new SearchResultCollection($results, $venues->count(), $this->getCode());
    }

    // ... keep other methods unchanged
    public function getDetails(string $itemId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        $venue = Venue::with(['city', 'packages', 'rooms', 'addons'])->find($itemId);
        if (! $venue) return null;

        return new \App\Services\Providers\DTO\ProviderItemDetails(
            id: (string) $itemId,
            name: $this->getCode() . '_' . $itemId,
            description: $this->name,
            images: $this->images ?? [],
            location: [
                'address' => $this->address,
                'city' => $this->city->name ?? '',
                'country' => $this->city->country->name ?? '',
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
            ],
            amenities: $this->amenities ?? [],
            pricing: [
                'currency' => 'INR',
                'packages' => $this->packages->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'price' => $p->price_per_guest ?? $p->fixed_price ?? ($p->price_per_hour * 24),
                    'currency' => $p->currency,
                ])->toArray(),
            ],
            policies: $this->policies ?? [],
            availability: [
                'check_in' => $this->check_in_out['check_in'] ?? '14:00',
                'check_out' => $this->check_in_out['check_out'] ?? '11:00',
            ],
            metadata: [
                'capacity' => $this->total_capacity,
                'venue_types' => $this->venue_types,
            ],
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $venue = Venue::find($itemId);
        if (! $venue) return new AvailabilityResult(false, 0, 0, 'INR');

        $date = $criteria['date'] ?? now()->toDateString();
        $available = \App\Models\VenueAvailability::where('venue_id', $venue->id)
            ->where('date', $criteria['date'] ?? now()->toDateString())
            ->where('status', 'available')
            ->exists();

        return new AvailabilityResult(
            available: $available,
            availableQuantity: 1,
            price: 0,
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
