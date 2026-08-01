<?php

namespace App\Services\Providers;

use App\Models\Transfer;
use App\Models\TransferPricing;
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

class DemoTransferProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = \App\Models\Transfer::query()->where('is_active', true)
            ->where('is_demo', true)
            ->with(['operator', 'vehicleType', 'pricing']);

        if (!empty($criteria['pickup_location_id'])) {
            $query->where('pickup_location_id', $criteria['pickup_location_id']);
        }

        if (!empty($criteria['dropoff_location_id'])) {
            $query->where('dropoff_location_id', $criteria['dropoff_location_id']);
        }

        if (!empty($criteria['date'])) {
            $query->whereHas('inventory', function ($q) use ($criteria) {
                $q->where('date', $criteria['date'])
                    ->where('available_vehicles', '>', 0);
            });
        }

        if (!empty($criteria['passengers'])) {
            $query->where('max_passengers', '>=', $criteria['passengers']);
        }

        if (!empty($criteria['luggage'])) {
            $query->where('max_luggage', '>=', $criteria['luggage']);
        }

        if (!empty($criteria['transfer_type'])) {
            $query->where('transfer_type', $criteria['transfer_type']);
        }

        if (!empty($criteria['price_min']) || !empty($criteria['price_max'])) {
            $query->whereHas('pricing', function ($q) use ($criteria) {
                if (!empty($criteria['price_min'])) {
                    $q->where('base_price', '>=', $criteria['price_min']);
                }
                if (!empty($criteria['price_max'])) {
                    $q->where('base_price', '<=', $criteria['price_max']);
                }
            });
        }

        $transfers = \App\Models\Transfer::query()
            ->where('is_active', true)
            ->where('is_demo', true)
            ->with(['operator', 'vehicleType', 'pricing'])
            ->limit(20)
            ->get();

        $results = $transfers->map(function ($transfer) {
            $price = $transfer->pricing->min('base_price') ?? 0;

            return new \App\Services\Providers\DTO\SearchResult(
                id: 'transfer_' . $transfer->id,
                name: $transfer->name,
                type: 'transfer',
                providerCode: $this->getCode(),
                providerItemId: (string) $transfer->id,
                location: [
                    'pickup' => $transfer->pickupLocation?->name ?? $transfer->pickup_address ?? '',
                    'dropoff' => $transfer->dropoffLocation?->name ?? $transfer->dropoff_address ?? '',
                ],
                pricing: [
                    'base_price' => (float) $transfer->pricing->min('base_price') ?? 0,
                    'currency' => 'INR',
                ],
                availability: [
                    'available' => $transfer->inventory()->where('available_vehicles', '>', 0)->exists(),
                    'vehicles_available' => $transfer->inventory()->where('available_vehicles', '>', 0)->sum('available_vehicles'),
                ],
                images: $transfer->images ?? [],
                amenities: $transfer->inclusions ?? [],
                metadata: [
                    'vehicle_type' => $transfer->vehicleType?->name,
                    'max_passengers' => $transfer->max_passengers,
                    'max_luggage' => $transfer->max_luggage,
                    'distance_km' => $transfer->distance_km,
                    'estimated_duration_minutes' => $transfer->estimated_duration_minutes,
                    'is_shared' => $transfer->is_shared,
                ],
                rating: $transfer->rating ?? 0,
                reviewCount: $transfer->review_count ?? 0,
            );
        })->toArray();

        return new SearchResultCollection($results, $transfers->count(), $this->getCode());
    }

    public function getDetails(string $itemId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        $transfer = \App\Models\Transfer::with(['operator', 'vehicleType', 'pricing', 'inventory'])->find($itemId);
        if (! $transfer) return null;

        return new \App\Services\Providers\DTO\ProviderItemDetails(
            id: (string) $itemId,
            name: $this->name,
            description: $this->description,
            images: $this->images ?? [],
            location: [
                'pickup' => $this->pickup_address,
                'dropoff' => $this->dropoff_address,
            ],
            amenities: $this->inclusions ?? [],
            pricing: [
                'currency' => 'INR',
                'pricing_options' => $this->pricing->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'base_price' => (float) $p->base_price,
                    'per_km_rate' => $p->per_km_rate ?? 0,
                    'per_hour_rate' => $p->per_hour_rate ?? 0,
                    'night_surcharge' => (float) ($p->night_surcharge ?? 0),
                    'waiting_charge_per_hour' => $p->waiting_charge_per_hour ?? 0,
                    'extra_luggage_charge' => $p->extra_luggage_charge ?? 0,
                    'currency' => $p->currency,
                ])->toArray(),
            ],
            policies: [
                'cancellation' => $this->cancellation_policy,
                'exclusions' => $this->exclusions ?? [],
            ],
            availability: [
                'transfer_type' => $this->transfer_type,
                'vehicle_type' => $this->vehicleType?->name,
                'max_passengers' => $this->max_passengers,
                'max_luggage' => $this->max_luggage,
                'distance_km' => $this->distance_km,
                'estimated_duration' => $this->estimated_duration_minutes,
                'is_shared' => $this->is_shared,
            ],
            metadata: [
                'operator' => $this->operator?->name,
                'vehicle_type' => $this->vehicleType?->name,
            ],
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $transfer = \App\Models\Transfer::find($itemId);
        if (! $transfer) return new AvailabilityResult(false, 0, 0, 'INR');

        $available = \App\Models\TransferInventory::where('transfer_id', $transfer->id)
            ->where('date', $criteria['date'] ?? now()->toDateString())
            ->where('available_vehicles', '>', 0)
            ->exists();

        $price = $transfer->pricing->min('base_price') ?? 0;

        return new AvailabilityResult(
            available: (bool) $available,
            availableQuantity: 1,
            price: (float) $price,
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
