<?php

namespace App\Services\Providers;

use App\Models\Car;
use App\Models\CarRate;
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

class DemoCarProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = \App\Models\Car::query()->where('is_active', true)
            ->where('is_demo', true)
            ->with(['company', 'category']);

        if (!empty($criteria['city_id'])) {
            $query->whereHas('pickupLocations', fn ($q) => $q->where('city_id', $criteria['city_id']));
        } elseif (!empty($criteria['city'])) {
            $query->whereHas('pickupLocations.city', fn ($q) => $q->where('name', 'like', "%{$criteria['city']}%"));
        }

        if (!empty($criteria['pickup_date']) && !empty($criteria['return_date'])) {
            $pickup = $criteria['pickup_date'];
            $return = $criteria['return_date'];
            $query->whereHas('inventory', function ($q) use ($criteria) {
                $q->whereBetween('date', [$criteria['pickup_date'], $criteria['return_date']])
                    ->where('available', true);
            });
        }

        if (!empty($criteria['passengers'])) {
            $query->whereHas('category', fn ($q) => $q->where('seats', '>=', $criteria['passengers']));
        }

        if (!empty($criteria['transmission'])) {
            $query->where('transmission', $criteria['transmission']);
        }

        if (!empty($criteria['fuel_type'])) {
            $query->where('fuel_type', $criteria['fuel_type']);
        }

        $cars = \App\Models\Car::query()
            ->where('is_active', true)
            ->where('is_demo', true)
            ->with(['company', 'category', 'rates'])
            ->orderBy('rating', 'desc')
            ->limit(20)
            ->get();

        $results = $cars->map(function ($car) {
            $rate = $car->rates->firstWhere('rate_type', 'daily');
            $price = $rate?->base_rate ?? 0;

            return new SearchResult(
                id: 'car_' . $car->id,
                name: $car->name,
                type: 'car',
                providerCode: $this->getCode(),
                providerItemId: (string) $car->id,
                location: [
                    'city' => $car->company?->city?->name ?? 'Multiple locations',
                    'country' => 'India',
                ],
                pricing: [
                    'base_price' => (float) $price,
                    'currency' => 'INR',
                    'per_day' => (float) ($rate?->base_rate ?? 0),
                ],
                availability: [
                    'available' => true,
                    'cars_available' => $car->inventory()->where('status', 'available')->count(),
                ],
                images: $car->images ?? [],
                amenities: $car->features ?? [],
                metadata: [
                    'seats' => $car->seats,
                    'doors' => $car->doors,
                    'transmission' => $car->transmission,
                    'fuel_type' => $car->fuel_type,
                    'is_ac' => $car->is_ac,
                    'features' => $car->features,
                    'category' => $car->category?->name,
                    'company' => $car->company?->name,
                    'rating' => $car->rating ?? 0,
                ],
                rating: $car->rating ?? 0,
                reviewCount: $car->review_count ?? 0,
            );
        })->toArray();

        return new SearchResultCollection($results, $cars->count(), $this->getCode());
    }

    public function getDetails(string $itemId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        $car = \App\Models\Car::with(['company', 'category', 'rates', 'pickupLocations'])->find($itemId);
        if (! $car) return null;

        $dailyRate = $car->rates->firstWhere('rate_type', 'daily');

        return new \App\Services\Providers\DTO\ProviderItemDetails(
            id: (string) $itemId,
            name: $car->name . ($car->year ? ' (' . $car->year . ')' : ''),
            description: ($car->company?->name ? $car->company->name . ' - ' : '') . $car->name,
            images: $car->images ?? [],
            location: [
                'city' => $car->company?->city?->name ?? 'Multiple locations',
                'country' => 'India',
            ],
            amenities: $car->features ?? [],
            pricing: [
                'currency' => 'INR',
                'daily_rate' => $dailyRate?->base_rate ?? 0,
                'km_included' => $dailyRate?->km_included ?? 200,
                'extra_km_rate' => $dailyRate?->extra_km_rate ?? 12,
                'driver_allowance' => $dailyRate?->driver_allowance ?? 1500,
                'deposit_amount' => $dailyRate?->deposit_amount ?? 5000,
                'insurance_options' => $dailyRate?->insurance_options ?? [],
            ],
            policies: $dailyRate?->cancellation_policy ?? [],
            availability: [
                'available' => true,
                'locations' => $car->pickupLocations->pluck('name')->toArray() ?: [],
            ],
            metadata: [
                'seats' => $car->seats,
                'transmission' => $car->transmission,
                'fuel_type' => $car->fuel_type,
                'is_ac' => $car->is_ac,
                'model' => $car->model,
                'year' => $car->year,
                'doors' => $car->doors,
                'company' => $car->company?->name,
            ],
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $car = \App\Models\Car::find($itemId);
        if (! $car) return new AvailabilityResult(false, 0, 0, 'INR');

        $available = \App\Models\CarInventory::where('car_id', $itemId)
            ->whereBetween('date', [$criteria['pickup_date'] ?? now()->toDateString(), $criteria['return_date'] ?? now()->addDays(7)->toDateString()])
            ->where('status', 'available')
            ->exists();

        $rate = \App\Models\CarRate::where('car_id', $itemId)->where('rate_type', 'daily')->first();
        $price = $rate?->base_rate ?? 0;

        return new AvailabilityResult(
            available: $available,
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
