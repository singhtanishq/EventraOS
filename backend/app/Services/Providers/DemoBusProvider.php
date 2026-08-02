<?php

namespace App\Services\Providers;

use App\Models\BusRoute;
use App\Models\BusType;
use App\Models\BusInventory;
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

class DemoBusProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = \App\Models\BusRoute::query()->where('is_active', true)
            ->where('is_demo', true)
            ->with(['operator', 'busTypes.fares.inventory']);

        if (!empty($criteria['origin_terminal_id'])) {
            $query->where('origin_terminal_id', $criteria['origin_terminal_id']);
        }

        if (!empty($criteria['destination_terminal_id'])) {
            $query->where('destination_terminal_id', $criteria['destination_terminal_id']);
        }

        if (!empty($criteria['journey_date'])) {
            $query->whereHas('busTypes.fares.inventory', function ($q) use ($criteria) {
                $q->where('date', $criteria['journey_date'])
                    ->where('available_seats', '>', 0);
            });
        }

        if (!empty($criteria['bus_type'])) {
            $query->whereHas('busTypes', function ($q) use ($criteria) {
                $q->where('name', 'like', "%{$criteria['bus_type']}%");
            });
        }

        if (!empty($criteria['price_min']) || !empty($criteria['price_max'])) {
            $query->whereHas('busTypes.fares.inventory', function ($q) use ($criteria) {
                if (!empty($criteria['price_min'])) {
                    $q->where('sell_price', '>=', $criteria['price_min']);
                }
                if (!empty($criteria['price_max'])) {
                    $q->where('sell_price', '<=', $criteria['price_max']);
                }
            });
        }

        $sort = $criteria['sort'] ?? 'recommended';
        match ($sort) {
            'cheapest' => $query->orderBy('busTypes.fares.inventory.sell_price', 'asc'),
            'fastest' => $query->orderBy('duration_minutes', 'asc'),
            'earliest' => $query->orderBy('departure_time', 'asc'),
            'latest' => $query->orderBy('departure_time', 'desc'),
            default => $query->orderBy('stops', 'asc')->orderBy('busTypes.fares.inventory.sell_price', 'asc'),
        };

        $buses = \App\Models\BusRoute::query()
            ->where('is_active', true)
            ->where('is_demo', true)
            ->with(['operator', 'busTypes.fares.inventory'])
            ->limit(20)
            ->get();

        $results = $buses->map(function ($bus) {
            $fare = $bus->busTypes->flatMap->fares->firstWhere('is_active', true);
            $inventory = $fare?->inventory()->where('available_seats', '>', 0)->first();
            $price = $inventory?->sell_price ?? 0;

            return new \App\Services\Providers\DTO\SearchResult(
                id: 'bus_' . $bus->id,
                name: $bus->operator->name . ' ' . $bus->route_name,
                type: 'bus',
                providerCode: $this->getCode(),
                providerItemId: (string)$bus->id,
                location: [
                    'origin' => [
                        'terminal' => $bus->originTerminal->name ?? '',
                        'code' => $bus->originTerminal->code ?? '',
                        'city' => $bus->originTerminal->city->name ?? '',
                    ],
                    'destination' => [
                        'terminal' => $bus->destinationTerminal->name ?? '',
                        'code' => $bus->destinationTerminal->code ?? '',
                        'city' => $bus->destinationTerminal->city->name ?? '',
                    ],
                ],
                pricing: [
                    'base_price' => $price,
                    'currency' => 'INR',
                    'total' => $price,
                    'per_passenger' => $price,
                ],
                availability: [
                    'available' => $inventory && $inventory->available_seats > 0,
                    'seats_available' => $inventory?->available_seats ?? 0,
                ],
                images: [$bus->operator->logo ?? ''],
                amenities: [
                    'bus_type' => $bus->busTypes->first()?->name ?? 'Unknown',
                    'stops' => 0,
                    'duration' => $bus->duration_minutes,
                    'layout' => $bus->busTypes->first()?->layout ?? 'N/A',
                    'berth_type' => $bus->busTypes->first()?->berth_type ?? 'seater',
                    'is_ac' => $bus->busTypes->first()?->is_ac ?? false,
                ],
                metadata: [
                    'operator' => $bus->operator->name ?? 'Unknown',
                    'bus_type' => $bus->busTypes->first()?->name ?? 'Unknown',
                    'departure_time' => $bus->departure_time,
                    'arrival_time' => $bus->arrival_time,
                    'duration_minutes' => $bus->duration_minutes,
                ],
                rating: 0,
                reviewCount: 0,
            );
        })->toArray();

        return new SearchResultCollection($results, $buses->count(), $this->getCode());
    }

    public function getDetails(string $itemId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        $bus = \App\Models\BusRoute::with(['operator', 'busTypes.fares.inventory'])->find($itemId);
        if (! $bus) return null;

        $fare = $bus->busTypes->flatMap->fares->firstWhere('is_active', true);
        $inventory = $fare?->inventory()->where('available_seats', '>', 0)->first();

        return new \App\Services\Providers\DTO\ProviderItemDetails(
            id: (string) $itemId,
            name: $bus->operator->name . ' ' . $bus->route_name,
            description: "Bus route from {$bus->originTerminal->name} to {$bus->destinationTerminal->name}",
            images: [$bus->operator->logo ?? ''],
            location: [
                'origin' => [
                    'terminal' => $bus->originTerminal->name ?? '',
                    'code' => $bus->originTerminal->code ?? '',
                    'city' => $bus->originTerminal->city->name ?? '',
                ],
                'destination' => [
                    'terminal' => $bus->destinationTerminal->name ?? '',
                    'code' => $bus->destinationTerminal->code ?? '',
                    'city' => $bus->destinationTerminal->city->name ?? '',
                ],
            ],
            amenities: $bus->busTypes->first()?->amenities ?? [],
            pricing: [
                'currency' => 'INR',
                'fare_options' => $bus->busTypes->flatMap->fares->filter(fn ($f) => $f->is_active)->map(function ($f) {
                    return [
                        'fare_id' => $f->id,
                        'name' => $f->name,
                        'bus_type' => $f->busType?->name,
                        'code' => $f->code,
                        'baggage_allowance' => $f->baggage_allowance,
                        'fare_rules' => $f->fare_rules,
                        'is_refundable' => $f->is_refundable,
                        'is_changeable' => $f->is_changeable,
                        'change_fee' => (float) $f->change_fee,
                        'cancel_fee' => (float) $f->cancel_fee,
                        'pricing' => [
                            'base_price' => $f->inventory()->min('sell_price') ?? 0,
                            'currency' => 'INR',
                            'total' => (float) $f->inventory()->min('sell_price') ?? 0,
                            'per_passenger' => $f->inventory()->min('sell_price') ?? 0,
                        ],
                        'availability' => [
                            'available' => $f->inventory()->where('available_seats', '>', 0)->exists(),
                            'seats_available' => $f->inventory()->where('available_seats', '>', 0)->sum('available_seats'),
                        ],
                    ])->toArray(),
            ],
            policies: [
                'cancellation' => $fare?->fare_rules ?? [],
                'change' => $fare?->fare_rules ?? [],
            ],
            availability: [
                'departure_time' => $this->departure_time,
                'arrival_time' => $this->arrival_time,
                'duration_minutes' => $this->duration_minutes,
            ],
            metadata: [
                'operator' => $this->operator->name ?? 'Unknown',
                'bus_type' => $this->busTypes->first()?->name ?? 'Unknown',
                'departure_time' => $this->departure_time,
                'arrival_time' => $this->arrival_time,
                'duration_minutes' => $this->duration_minutes,
            ],
            rating: 0,
            reviewCount: 0,
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $bus = \App\Models\BusRoute::find($itemId);
        if (! $bus) return new AvailabilityResult(false, 0, 0, 'INR');

        $fareId = $criteria['fare_id'] ?? null;
        $fare = $fareId
            ? \App\Models\BusFare::find($fareId)
            : \App\Models\BusFare::where('bus_route_id', $bus->id)->where('is_active', true)->first();

        $available = $fare?->inventory()
            ->where('date', $criteria['journey_date'] ?? now()->toDateString())
            ->where('available_seats', '>', 0)
            ->exists();

        return new AvailabilityResult(
            available: $available ?? false,
            availableQuantity: $available ? 1 : 0,
            price: $fare?->pricing['per_passenger'] ?? 0,
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
            bookingReference: $bookingData['booking_reference'] ?? 'EVR-BUS-' . strtoupper(\Illuminate\Support\Str::random(6)),
            providerReference: 'DEMO-BUS-' . strtoupper(\Illuminate\Support\Str::random(8)),
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
