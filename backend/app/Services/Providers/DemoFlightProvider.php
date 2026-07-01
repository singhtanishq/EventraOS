<?php

namespace App\Services\Providers;

use App\Models\Provider;
use App\Services\Providers\DTO\{
    SearchResultCollection,
    SearchResult,
    ProviderItemDetails,
    AvailabilityResult,
    HoldResult,
    BookingConfirmation,
    CancellationResult,
    BookingStatus,
    RefundResult
};
use Illuminate\Support\Facades\DB;

class DemoFlightProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = \App\Models\Flight::with([
            'airline', 
            'departureAirport', 
            'arrivalAirport', 
            'fares.inventory'
        ])
        ->where('is_active', true)
        ->where('is_demo', true);

        if (!empty($criteria['origin_airport_id'])) {
            $query->where('departure_airport_id', $criteria['origin_airport_id']);
        }

        if (!empty($criteria['destination_airport_id'])) {
            $query->where('arrival_airport_id', $criteria['destination_airport_id']);
        }

        if (!empty($criteria['departure_date'])) {
            $date = \Carbon\Carbon::parse($criteria['departure_date']);
            $query->whereDate('departure_date', $date);
        }

        if (!empty($criteria['cabin_class'])) {
            $query->whereHas('fares', function ($q) use ($criteria) {
                $q->where('cabin_class', $criteria['cabin_class']);
            });
        }

        if (!empty($criteria['stops']) && $criteria['stops'] === 0) {
            $query->where('stops', 0);
        }

        if (!empty($criteria['airline_ids'])) {
            $query->whereIn('airline_id', $criteria['airline_ids']);
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
            'cheapest' => $query->orderBy('departure_time', 'asc'),
            'fastest' => $query->orderBy('duration_minutes', 'asc'),
            'earliest' => $query->orderBy('departure_time', 'asc'),
            'latest' => $query->orderBy('departure_time', 'desc'),
            default => $query->orderBy('stops', 'asc')->orderBy('departure_time', 'asc'),
        };

        $perPage = $criteria['per_page'] ?? 20;
        $page = $criteria['page'] ?? 1;
        
        $results = $query->paginate($perPage, ['*'], 'page', $page);

        $searchResults = $results->getCollection()->map(function ($flight) use ($criteria) {
            $passengers = ($criteria['adults'] ?? 1) + ($criteria['children'] ?? 0) + ($criteria['infants'] ?? 0);
            $cabinClass = $criteria['cabin_class'] ?? 'economy';
            
            $fare = $flight->fares()
                ->where('cabin_class', $cabinClass)
                ->where('is_active', true)
                ->first();

            $inventory = $fare?->inventory()
                ->where('date', $flight->departure_date)
                ->where('available_seats', '>', 0)
                ->first();

            $price = $inventory?->sell_price ?? 0;

            return new SearchResult(
                id: 'flight_' . $flight->id,
                name: $flight->airline->name . ' ' . $flight->flight_number,
                type: 'flight',
                providerCode: $this->getCode(),
                providerItemId: (string)$flight->id,
                location: [
                    'origin' => [
                        'airport' => $flight->departureAirport->name ?? '',
                        'code' => $flight->departureAirport->iata_code ?? '',
                        'city' => $flight->departureAirport->city->name ?? '',
                        'terminal' => $flight->departureAirport->terminal_info ?? null,
                    ],
                    'destination' => [
                        'airport' => $flight->arrivalAirport->name ?? '',
                        'code' => $flight->arrivalAirport->iata_code ?? '',
                        'city' => $flight->arrivalAirport->city->name ?? '',
                        'terminal' => $flight->arrivalAirport->terminal_info ?? null,
                    ],
                ],
                pricing: [
                    'base_price' => $price,
                    'currency' => 'INR',
                    'total' => $price * $passengers,
                    'per_passenger' => $price,
                ],
                availability: [
                    'available' => $inventory && $inventory->available_seats > 0,
                    'seats_available' => $inventory?->available_seats ?? 0,
                ],
                images: [$flight->airline->logo ?? ''],
                amenities: [
                    'baggage' => $fare?->baggage_allowance ?? [],
                    'stops' => $flight->stops,
                    'duration' => $flight->duration_minutes,
                    'aircraft' => $flight->aircraft_name,
                ],
                metadata: [
                    'flight_number' => $flight->flight_number,
                    'airline' => $flight->airline->name,
                    'airline_code' => $flight->airline->code,
                    'departure_time' => $flight->departure_time,
                    'arrival_time' => $flight->arrival_time,
                    'duration_minutes' => $flight->duration_minutes,
                    'stops' => $flight->stops,
                    'refundable' => $fare?->is_refundable ?? false,
                ],
                rating: 0,
                reviewCount: 0,
            );
        });

        return new SearchResultCollection(
            $searchResults->toArray(),
            $results->total(),
            $this->getCode()
        );
    }

    public function getDetails(string $itemId, array $options = []): ?ProviderItemDetails
    {
        $flightId = str_replace('flight_', '', $itemId);
        $flight = \App\Models\Flight::with([
            'airline', 
            'departureAirport', 
            'arrivalAirport', 
            'fares.inventory',
            'segments'
        ])->where('is_demo', true)->find($flightId);

        if (!$flight) return null;

        $passengers = ($options['adults'] ?? 1) + ($options['children'] ?? 0) + ($options['infants'] ?? 0);
        $cabinClass = $options['cabin_class'] ?? 'economy';

        $fare = $flight->fares()->where('cabin_class', $cabinClass)->where('is_active', true)->first();
        $inventory = $fare?->inventory()->where('date', $flight->departure_date)->where('available_seats', '>', 0)->first();

        $fareOptions = $flight->fares->map(function ($f) use ($flight, $passengers) {
            $inv = $f->inventory()->where('date', $flight->departure_date)->where('available_seats', '>', 0)->first();
            return [
                'fare_id' => $f->id,
                'name' => $f->name,
                'cabin_class' => $f->cabin_class,
                'code' => $f->code,
                'baggage_allowance' => $f->baggage_allowance,
                'fare_rules' => $f->fare_rules,
                'is_refundable' => $f->is_refundable,
                'is_changeable' => $f->is_changeable,
                'change_fee' => $f->change_fee,
                'cancel_fee' => $f->cancel_fee,
                'pricing' => [
                    'base_price' => $inv?->sell_price ?? 0,
                    'currency' => 'INR',
                    'total' => ($inv?->sell_price ?? 0) * $passengers,
                    'per_passenger' => $inv?->sell_price ?? 0,
                ],
                'availability' => [
                    'available' => $inv && $inv->available_seats > 0,
                    'seats_available' => $inv?->available_seats ?? 0,
                ],
            ];
        })->filter(fn($f) => $f['availability']['available'])->toArray();

        return new ProviderItemDetails(
            id: $itemId,
            name: $flight->airline->name . ' ' . $flight->flight_number,
            description: "Flight from {$flight->departureAirport->name} to {$flight->arrivalAirport->name}",
            images: [$flight->airline->logo ?? ''],
            location: [
                'origin' => [
                    'airport' => $flight->departureAirport->name,
                    'code' => $flight->departureAirport->iata_code,
                    'city' => $flight->departureAirport->city->name ?? '',
                    'terminal' => $flight->departureAirport->terminal_info ?? null,
                    'timezone' => $flight->departure_timezone,
                ],
                'destination' => [
                    'airport' => $flight->arrivalAirport->name,
                    'code' => $flight->arrivalAirport->iata_code,
                    'city' => $flight->arrivalAirport->city->name ?? '',
                    'terminal' => $flight->arrivalAirport->terminal_info ?? null,
                    'timezone' => $flight->arrival_timezone,
                ],
            ],
            amenities: [
                'baggage' => $fare?->baggage_allowance ?? [],
                'stops' => $flight->stops,
                'duration' => $flight->duration_minutes,
                'aircraft' => $flight->aircraft_name,
            ],
            pricing: [
                'currency' => 'INR',
                'fare_options' => $fareOptions,
            ],
            policies: [
                'cancellation' => $fare?->fare_rules ?? [],
                'change' => $fare?->fare_rules ?? [],
            ],
            availability: [
                'departure_date' => $flight->departure_date->toDateString(),
                'departure_time' => $flight->departure_time,
                'arrival_time' => $flight->arrival_time,
                'duration_minutes' => $flight->duration_minutes,
            ],
            metadata: [
                'flight_number' => $flight->flight_number,
                'airline' => $flight->airline->name,
                'airline_code' => $flight->airline->code,
                'stops' => $flight->stops,
                'segments' => $flight->segments->toArray(),
            ],
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $details = $this->getDetails($itemId, $criteria);
        if (!$details) {
            return new AvailabilityResult(false, 0, 0, 'INR');
        }

        $fareId = $criteria['fare_id'] ?? null;
        $fareOption = $fareId 
            ? collect($details->getPricing()['fare_options'] ?? [])->firstWhere('fare_id', $fareId)
            : collect($details->getPricing()['fare_options'] ?? [])->first();

        if (!$fareOption) {
            return new AvailabilityResult(false, 0, 0, 'INR');
        }

        return new AvailabilityResult(
            available: $fareOption['availability']['available'] ?? false,
            availableQuantity: $fareOption['availability']['seats_available'] ?? 0,
            price: $fareOption['pricing']['per_passenger'] ?? 0,
            currency: 'INR',
            holdExpiresAt: now()->addMinutes(config('booking.hold_duration_minutes', 15))
        );
    }

    public function createHold(array $bookingData): HoldResult
    {
        $holdReference = 'HOLD-FLT-' . strtoupper(\Illuminate\Support\Str::random(8));
        $expiresAt = now()->addMinutes(config('booking.hold_duration_minutes', 15));

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
            bookingReference: $bookingData['booking_reference'] ?? 'EVR-FLT-' . strtoupper(\Illuminate\Support\Str::random(6)),
            providerReference: 'DEMO-FLT-' . strtoupper(\Illuminate\Support\Str::random(8)),
            confirmationDetails: ['provider' => $this->getCode(), 'confirmed_at' => now()->toISOString()],
            successful: true
        );
    }

    public function cancelBooking(string $bookingReference, array $options = []): CancellationResult
    {
        return new CancellationResult(true, $options['refund_amount'] ?? 0, $options['cancellation_fee'] ?? 0, 'CAN-' . strtoupper(\Illuminate\Support\Str::random(8)));
    }

    public function getBookingStatus(string $bookingReference): BookingStatus
    {
        return new BookingStatus('confirmed', 'confirmed', []);
    }

    public function processRefund(string $bookingReference, float $amount, string $reason): RefundResult
    {
        return new RefundResult(true, 'REF-' . strtoupper(\Illuminate\Support\Str::random(8)), $amount, now()->addDays(5));
    }
}