<?php

namespace App\Services\Providers;

use App\Models\TravelPackage;
use App\Models\PackagePricing;
use App\Models\PackageInventory;
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

class DemoPackageProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = \App\Models\TravelPackage::query()->where('is_active', true)
            ->where('is_demo', true)
            ->with(['pricing']);

        if (!empty($criteria['destination_ids'])) {
            $query->whereHas('items', function ($q) use ($criteria) {
                $q->whereIn('service_name', $criteria['destination_ids']);
            });
        }

        if (!empty($criteria['start_date']) && !empty($criteria['end_date'])) {
            $query->whereHas('inventory', function ($q) use ($criteria) {
                $q->whereBetween('start_date', [$criteria['start_date'], $criteria['end_date']])
                    ->where('available_slots', '>', 0);
            });
        }

        if (!empty($criteria['participants'])) {
            $query->where('min_participants', '<=', $criteria['participants'])
                ->where(function ($q) use ($criteria) {
                    $q->where('max_participants', '>=', $criteria['participants'])
                      ->orWhereNull('max_participants');
                });
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

        $sort = $criteria['sort'] ?? 'recommended';
        match ($sort) {
            'price_low' => $query->orderBy('pricing.price', 'asc'),
            'price_high' => $query->orderBy('pricing.price', 'desc'),
            'rating' => $query->orderBy('rating', 'desc'),
            'duration' => $query->orderBy('duration_nights', 'asc'),
            default => $query->orderBy('rating', 'desc')->orderBy('pricing.price', 'asc'),
        };

        $packages = \App\Models\TravelPackage::query()
            ->where('is_active', true)
            ->where('is_demo', true)
            ->with(['pricing', 'items'])
            ->limit(20)
            ->get();

        $results = $packages->map(function ($pkg) {
            $pricing = $pkg->pricing->firstWhere('is_active', true);
            $price = $pricing?->price ?? 0;

            return new \App\Services\Providers\DTO\SearchResult(
                id: 'package_' . $pkg->id,
                name: $pkg->name,
                type: 'package',
                providerCode: $this->getCode(),
                providerItemId: (string)$pkg->id,
                location: [
                    'destinations' => $pkg->destinations->map(fn ($d) => [
                        'city' => $d['city'],
                        'country' => $d['country'],
                    ])->toArray(),
                ],
                pricing: [
                    'base_price' => $price,
                    'currency' => 'INR',
                    'total' => $price,
                    'per_person' => $pricing->price ?? $price,
                    'occupancy' => $pricing->occupancy ?? 'double',
                ],
                availability: [
                    'available' => $pkg->inventory()->where('available_slots', '>', 0)->exists(),
                    'slots_available' => $pkg->inventory()->where('available_slots', '>', 0)->sum('available_slots'),
                ],
                images: $pkg->images ?? [],
                amenities: [
                    'nights' => $pkg->duration_nights,
                    'days' => $pkg->duration_days,
                    'min_participants' => $pkg->min_participants,
                    'max_participants' => $pkg->max_participants,
                ],
                metadata: [
                    'duration_nights' => $pkg->duration_nights,
                    'duration_days' => $pkg->duration_days,
                    'min_participants' => $pkg->min_participants,
                    'max_participants' => $pkg->max_participants,
                    'includes' => $pkg->includes ?? [],
                    'excludes' => $pkg->excludes ?? [],
                    'highlights' => $pkg->highlights ?? [],
                    'rating' => $pkg->rating,
                    'review_count' => $pkg->review_count,
                ],
                rating: $pkg->rating ?? 0,
                reviewCount: $pkg->review_count ?? 0,
            );
        })->toArray();

        return new SearchResultCollection($results, $packages->count(), $this->getCode());
    }

    public function getDetails(string $itemId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        $pkg = \App\Models\TravelPackage::with(['pricing', 'items'])->find($itemId);
        if (! $pkg) return null;

        $pricing = $pkg->pricing->firstWhere('is_active', true);
        $price = $pricing?->price ?? 0;

        return new \App\Services\Providers\DTO\ProviderItemDetails(
            id: (string) $itemId,
            name: $pkg->name,
            description: $pkg->description,
            images: $pkg->images ?? [],
            location: [
                'destinations' => $pkg->destinations->map(fn ($d) => [
                    'city' => $d['city'],
                    'country' => $d['country'],
                ])->toArray(),
            ],
            amenities: $pkg->includes ?? [],
            pricing: [
                'currency' => 'INR',
                'pricing_options' => $pkg->pricing->map(function ($p) {
                    return [
                        'pricing_id' => $p->id,
                        'name' => $p->name,
                        'occupancy' => $p->occupancy,
                        'price' => (float) $p->price,
                        'currency' => $p->currency,
                        'includes' => $p->includes ?? [],
                        'room_configuration' => $p->room_configuration ?? '',
                    ];
                })->toArray(),
            ],
            policies: [
                'cancellation' => $pkg->cancellation_policy ?? 'Standard cancellation policy applies.',
                'exclusions' => $pkg->excludes ?? [],
            ],
            availability: [
                'start_dates' => $pkg->inventory->pluck('start_date')->toArray(),
                'end_dates' => $pkg->inventory->pluck('end_date')->toArray(),
                'slots_available' => $pkg->inventory->where('available_slots', '>', 0)->sum('available_slots'),
            ],
            metadata: [
                'duration_nights' => $pkg->duration_nights,
                'duration_days' => $pkg->duration_days,
                'min_participants' => $pkg->min_participants,
                'max_participants' => $pkg->max_participants,
                'includes' => $pkg->includes ?? [],
                'excludes' => $pkg->excludes ?? [],
                'highlights' => $pkg->highlights ?? [],
            ],
            rating: $pkg->rating ?? 0,
            reviewCount: $pkg->review_count ?? 0,
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $pkg = \App\Models\TravelPackage::find($itemId);
        if (! $pkg) return new AvailabilityResult(false, 0, 0, 'INR');

        $available = $pkg->inventory()
            ->where('start_date', '>=', $criteria['start_date'] ?? now()->toDateString())
            ->where('end_date', '<=', $criteria['end_date'] ?? now()->addDays(30)->toDateString())
            ->where('available_slots', '>', 0)
            ->exists();

        $price = $pkg->pricing->firstWhere('is_active', true)?->price ?? 0;

        return new AvailabilityResult(
            available: $available,
            availableQuantity: $available ? 1 : 0,
            price: $price,
            currency: 'INR',
            holdExpiresAt: now()->addMinutes(15)
        );
    }

    public function createHold(array $bookingData): HoldResult
    {
        $holdReference = 'HOLD-' . strtoupper(\Illuminate\Support\Str::random(10));
        $expiresAt = now()->addMinutes(15);

        return new HoldResult(
            holdReference: $holdReference,
            expiresAt: $expiresAt,
            heldItems: $bookingData['items'] ?? [],
            successful: true
        );
    }

    public function confirmBooking(string $holdReference, array $bookingData): BookingConfirmation
    {
        return new BookingConfirmation(
            bookingReference: $bookingData['booking_reference'] ?? 'EVR-' . strtoupper(\Illuminate\Support\Str::random(6)),
            providerReference: 'DEMO-PKG-' . strtoupper(\Illuminate\Support\Str::random(8)),
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
