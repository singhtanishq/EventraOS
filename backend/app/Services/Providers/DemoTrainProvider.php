<?php

namespace App\Services\Providers;

use App\Models\TrainRoute;
use App\Models\TrainFare;
use App\Models\TrainInventory;
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

class DemoTrainProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = \App\Models\TrainRoute::query()->where('is_active', true)
            ->where('is_demo', true)
            ->with(['operator', 'fares', 'inventory']);

        if (!empty($criteria['origin_station_id'])) {
            $query->where('origin_station_id', $criteria['origin_station_id']);
        }

        if (!empty($criteria['destination_station_id'])) {
            $query->where('destination_station_id', $criteria['destination_station_id']);
        }

        if (!empty($criteria['journey_date'])) {
            $query->whereHas('inventory', function ($q) use ($criteria) {
                $q->whereDate('journey_date', $criteria['journey_date'])
                    ->where('available_berths', '>', 0);
            });
        }

        if (!empty($criteria['class'])) {
            $query->whereHas('fares', function ($q) use ($criteria) {
                $q->where('class_id', $criteria['class']);
            });
        }

        if (!empty($criteria['quota'])) {
            $query->whereHas('fares', function ($q) use ($criteria) {
                $q->where('quota', $criteria['quota']);
            });
        }

        if (!empty($criteria['price_min']) || !empty($criteria['price_max'])) {
            $query->whereHas('fares.inventory', function ($q) use ($criteria) {
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
            'cheapest' => $query->orderBy('fares.inventory.sell_price', 'asc'),
            'fastest' => $query->orderBy('duration_minutes', 'asc'),
            'earliest' => $query->orderBy('departure_time', 'asc'),
            'latest' => $query->orderBy('departure_time', 'desc'),
            default => $query->orderBy('stops', 'asc')->orderBy('fares.inventory.sell_price', 'asc'),
        };

        $trains = \App\Models\TrainRoute::query()
            ->where('is_active', true)
            ->where('is_demo', true)
            ->with(['operator', 'fares.inventory'])
            ->limit(20)
            ->get();

        $results = $trains->map(function ($train) {
            $fare = $train->fares()->where('is_active', true)->first();
            $price = $fare?->inventory()->where('available_berths', '>', 0)->min('sell_price') ?? 0;

            return new \App\Services\Providers\DTO\SearchResult(
                id: 'train_' . $train->id,
                name: $train->train_name,
                type: 'train',
                providerCode: $this->getCode(),
                providerItemId: (string) $train->id,
                location: [
                    'origin' => [
                        'station' => $train->originStation->name ?? '',
                        'code' => $train->originStation->code ?? '',
                        'city' => $train->originStation->city->name ?? '',
                    ],
                    'destination' => [
                        'station' => $train->destinationStation->name ?? '',
                        'code' => $train->destinationStation->code ?? '',
                        'city' => $train->destinationStation->city->name ?? '',
                    ],
                ],
                pricing: [
                    'base_price' => (float) $price,
                    'currency' => 'INR',
                    'total' => (float) $price,
                    'per_passenger' => (float) $price,
                ],
                availability: [
                    'available' => $train->inventory()->where('available_berths', '>', 0)->exists(),
                    'berths_available' => $train->inventory()->where('available_berths', '>', 0)->sum('available_berths'),
                    'rac_available' => $train->inventory()->where('rac_count', '>', 0)->sum('rac_count'),
                    'wl_available' => $train->inventory()->where('wl_count', '>', 0)->sum('wl_count'),
                ],
                images: [$train->operator->logo ?? ''],
                amenities: [
                    'stops' => $train->stops,
                    'duration' => $train->duration_minutes,
                    'train_type' => $train->train_type,
                ],
                metadata: [
                    'train_number' => $train->train_number,
                    'train_name' => $train->train_name,
                    'train_type' => $train->train_type,
                    'stops' => $train->stops,
                    'duration_minutes' => $train->duration_minutes,
                    'refundable' => $fare->is_refundable ?? false,
                ],
                rating: 0,
                reviewCount: 0,
            );
        })->toArray();

        return new SearchResultCollection($results, $trains->count(), $this->getCode());
    }

    public function getDetails(string $itemId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        $train = \App\Models\TrainRoute::with(['operator', 'fares.inventory', 'originStation', 'destinationStation'])->find($itemId);
        if (! $train) return null;

        return new \App\Services\Providers\DTO\ProviderItemDetails(
            id: (string) $itemId,
            name: $this->name,
            description: $this->description,
            images: $this->images ?? [],
            location: [
                'origin' => [
                    'station' => $this->originStation->name ?? '',
                    'code' => $this->originStation->code ?? '',
                    'city' => $this->originStation->city->name ?? '',
                    'timezone' => $this->departure_timezone,
                ],
                'destination' => [
                    'station' => $this->arrivalStation->name ?? '',
                    'code' => $this->arrivalStation->code ?? '',
                    'city' => $this->arrivalStation->city->name ?? '',
                    'timezone' => $this->arrival_timezone,
                ],
            ],
            amenities: [
                'stops' => $this->stops,
                'duration' => $this->duration_minutes,
                'train_type' => $this->train_type,
            ],
            pricing: [
                'currency' => 'INR',
                'fare_options' => $this->fares->map(function ($f) {
                    return [
                        'fare_id' => $f->id,
                        'name' => $f->name,
                        'cabin_class' => $f->cabin_class,
                        'code' => $f->code,
                        'baggage_allowance' => $f->baggage_allowance,
                        'fare_rules' => $f->fare_rules,
                        'is_refundable' => $f->is_refundable,
                        'is_changeable' => $f->is_changeable,
                        'change_fee' => (float) $f->change_fee,
                        'cancel_fee' => (float) $f->cancel_fee,
                        'pricing' => [
                            'base_price' => (float) $f->inventory()->min('sell_price') ?? 0,
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
                'cancellation' => $this->fare_rules ?? [],
                'change' => $this->fare_rules ?? [],
            ],
            availability: [
                'departure_date' => $this->departure_date->toDateString(),
                'departure_time' => $this->departure_time,
                'arrival_time' => $this->arrival_time,
                'duration_minutes' => $this->duration_minutes,
                'stops' => $this->stops,
            ],
            metadata: [
                'train_number' => $this->flight_number ?? $this->train_number,
                'airline' => $this->airline->name ?? $this->operator?->name,
                'airline_code' => $this->airline->code ?? $this->operator?->code,
                'stops' => $this->stops,
                'segments' => $this->segments->toArray(),
            ],
            rating: 0,
            reviewCount: 0,
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $train = \App\Models\TrainRoute::find($itemId);
        if (! $train) return new AvailabilityResult(false, 0, 0, 'INR');

        $classId = $criteria['class_id'] ?? null;
        $fare = $classId
            ? \App\Models\TrainFare::where('train_route_id', $train->id)->where('class_id', $classId)->first()
            : \App\Models\TrainFare::where('train_route_id', $train->id)->first();

        $available = $train->inventory()
            ->where('fare_id', $fare?->id)
            ->where('journey_date', $criteria['journey_date'] ?? now()->toDateString())
            ->where('available_berths', '>', 0)
            ->exists();

        return new AvailabilityResult(
            available: $available,
            availableQuantity: $train->inventory()->where('fare_id', $fare?->id)->where('available_berths', '>', 0)->sum('available_berths'),
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
            bookingReference: $bookingData['booking_reference'] ?? 'EVR-' . strtoupper(\Illuminate\Support\Str::random(6)),
            providerReference: 'DEMO-TRN-' . strtoupper(\Illuminate\Support\Str::random(8)),
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
