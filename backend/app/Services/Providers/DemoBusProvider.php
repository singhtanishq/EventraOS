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
            ->with(['operator', 'types.fares.inventory']);

        if (!empty($criteria['origin_terminal_id'])) {
            $query->where('origin_terminal_id', $criteria['origin_terminal_id']);
        }

        if (!empty($criteria['destination_terminal_id'])) {
            $query->where('destination_terminal_id', $criteria['destination_terminal_id']);
        }

        if (!empty($criteria['departure_date'])) {
            $query->whereHas('types.fares.inventory', function ($q) use ($criteria) {
                $q->whereDate('journey_date', $criteria['departure_date'])
                    ->where('available_seats', '>', 0);
            });
        } elseif (!empty($criteria['journey_date'])) {
            $query->whereHas('types.fares.inventory', function ($q) use ($criteria) {
                $q->whereDate('journey_date', $criteria['journey_date'])
                    ->where('available_seats', '>', 0);
            });
        }

        if (!empty($criteria['bus_type'])) {
            $query->whereHas('types', function ($q) use ($criteria) {
                $q->where('name', 'like', "%{$criteria['bus_type']}%");
            });
        }

        if (!empty($criteria['price_min']) || !empty($criteria['price_max'])) {
            $query->whereHas('types.fares.inventory', function ($q) use ($criteria) {
                if (!empty($criteria['price_min'])) {
                    $q->where('current_fare', '>=', $criteria['price_min']);
                }
                if (!empty($criteria['price_max'])) {
                    $q->where('current_fare', '<=', $criteria['price_max']);
                }
            });
        }

        $sort = $criteria['sort'] ?? 'recommended';
        match ($sort) {
            'cheapest' => $query->orderBy('departure_time', 'asc'),
            'fastest' => $query->orderBy('duration_minutes', 'asc'),
            'earliest' => $query->orderBy('departure_time', 'asc'),
            'latest' => $query->orderBy('departure_time', 'desc'),
            default => $query->orderBy('departure_time', 'asc'),
        };

        $buses = $query->limit(20)->get();

        $results = $buses->map(function ($bus) {
            $fare = $bus->types->flatMap->fares->firstWhere('is_active', true);
            $inventory = $fare?->inventory()->where('available_seats', '>', 0)->first();
            $price = $inventory?->current_fare ?? 0;

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
                    'bus_type' => $bus->types->first()?->name ?? 'Unknown',
                    'stops' => 0,
                    'duration' => $bus->duration_minutes,
                    'layout' => $bus->types->first()?->layout ?? 'N/A',
                    'berth_type' => $bus->types->first()?->berth_type ?? 'seater',
                    'is_ac' => $bus->types->first()?->is_ac ?? false,
                ],
                metadata: [
                    'operator' => $bus->operator->name ?? 'Unknown',
                    'bus_type' => $bus->types->first()?->name ?? 'Unknown',
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
        $bus = \App\Models\BusRoute::with(['operator', 'originTerminal.city', 'destinationTerminal.city', 'types.fares.inventory'])->find($itemId);
        if (! $bus) return null;

        $fareOptions = $bus->types->flatMap(function ($type) {
            return $type->fares->filter(fn ($f) => $f->is_active)->map(function ($f) use ($type) {
                $inv = $f->inventory();
                $sellPrice = (float) ($inv->min('current_fare') ?? $f->base_fare ?? 0);

                return [
                    'fare_id' => 'bustype_' . $type->id,
                    'name' => $type->name,
                    'bus_type' => $type->name,
                    'code' => $type->code,
                    'layout' => $type->layout,
                    'berth_type' => $type->berth_type,
                    'is_ac' => $type->is_ac,
                    'is_refundable' => true,
                    'fare_rules' => $f->cancellation_policy ?? [],
                    'pricing' => [
                        'base_price' => $sellPrice,
                        'currency' => $f->currency ?? 'INR',
                        'total' => $sellPrice,
                        'per_passenger' => $sellPrice,
                    ],
                    'availability' => [
                        'available' => $inv->where('available_seats', '>', 0)->exists(),
                        'seats_available' => $inv->where('available_seats', '>', 0)->sum('available_seats'),
                    ],
                ];
            });
        })->values();

        $firstPrice = $fareOptions->first()['pricing']['total'] ?? 0;

        return new \App\Services\Providers\DTO\ProviderItemDetails(
            id: (string) $itemId,
            name: $bus->operator->name . ' ' . $bus->route_name,
            description: "Bus route from {$bus->originTerminal?->name} to {$bus->destinationTerminal?->name}",
            images: [$bus->operator->logo ?? ''],
            location: [
                'origin' => [
                    'terminal' => $bus->originTerminal?->name ?? '',
                    'code' => $bus->originTerminal?->code ?? '',
                    'city' => $bus->originTerminal?->city?->name ?? '',
                ],
                'destination' => [
                    'terminal' => $bus->destinationTerminal?->name ?? '',
                    'code' => $bus->destinationTerminal?->code ?? '',
                    'city' => $bus->destinationTerminal?->city?->name ?? '',
                ],
            ],
            amenities: $bus->types->first()?->amenities ?? [],
            pricing: [
                'currency' => 'INR',
                'base_price' => $firstPrice,
                'total' => $firstPrice,
                'per_passenger' => $firstPrice,
                'fare_options' => $fareOptions->toArray(),
            ],
            policies: [],
            availability: [
                'available' => $fareOptions->contains(fn ($o) => ($o['availability']['available'] ?? false) === true),
                'seats_available' => $fareOptions->sum(fn ($o) => $o['availability']['seats_available'] ?? 0),
            ],
            metadata: [
                'departure_time' => $bus->departure_time,
                'arrival_time' => $bus->arrival_time,
                'duration_minutes' => $bus->duration_minutes,
                'boarding_points' => $bus->boarding_points ?? [],
                'dropping_points' => $bus->dropping_points ?? [],
            ],
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
