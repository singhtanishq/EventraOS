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

class DemoHotelProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        $query = \App\Models\Hotel::with(['roomTypes.rates', 'city'])
            ->where('is_active', true)
            ->where('is_demo', true);

        if (!empty($criteria['city_id'])) {
            $query->where('city_id', $criteria['city_id']);
        }

        if (!empty($criteria['check_in']) && !empty($criteria['check_out'])) {
            $checkIn = \Carbon\Carbon::parse($criteria['check_in']);
            $checkOut = \Carbon\Carbon::parse($criteria['check_out']);
            
            $query->whereHas('roomTypes.inventory', function ($q) use ($checkIn, $checkOut) {
                $q->whereBetween('date', [$checkIn, $checkOut->copy()->subDay()])
                  ->where('available_rooms', '>', 0)
                  ->where('is_closed', false);
            });
        }

        if (!empty($criteria['guests'])) {
            $query->whereHas('roomTypes', function ($q) use ($criteria) {
                $q->where('adult_capacity', '>=', $criteria['guests']['adults'] ?? 1);
            });
        }

        if (!empty($criteria['star_rating'])) {
            $query->where('star_rating', '>=', $criteria['star_rating']);
        }

        if (!empty($criteria['price_min']) || !empty($criteria['price_max'])) {
            $query->whereHas('roomTypes.inventory', function ($q) use ($criteria) {
                if (!empty($criteria['price_min'])) {
                    $q->where('sell_price', '>=', $criteria['price_min']);
                }
                if (!empty($criteria['price_max'])) {
                    $q->where('sell_price', '<=', $criteria['price_max']);
                }
            });
        }

        if (!empty($criteria['amenities'])) {
            $query->where(function ($q) use ($criteria) {
                foreach ($criteria['amenities'] as $amenity) {
                    $q->orWhereJsonContains('amenities', $amenity);
                }
            });
        }

        $sort = $criteria['sort'] ?? 'recommended';
        match ($sort) {
            'price_low' => $query->orderBy('roomTypes.inventory.sell_price', 'asc'),
            'price_high' => $query->orderBy('roomTypes.inventory.sell_price', 'desc'),
            'rating' => $query->orderBy('rating', 'desc'),
            'distance' => $query->orderBy('sort_order', 'asc'),
            default => $query->orderBy('is_featured', 'desc')->orderBy('rating', 'desc'),
        };

        $perPage = $criteria['per_page'] ?? 20;
        $page = $criteria['page'] ?? 1;
        
        $results = $query->paginate($perPage, ['*'], 'page', $page);

        $searchResults = $results->getCollection()->map(function ($hotel) use ($criteria) {
            $minPrice = $hotel->roomTypes->flatMap->inventory
                ->where('available_rooms', '>', 0)
                ->where('is_closed', false)
                ->min('sell_price') ?? 0;

            $checkIn = \Carbon\Carbon::parse($criteria['check_in'] ?? now()->addDay());
            $checkOut = \Carbon\Carbon::parse($criteria['check_out'] ?? now()->addDays(2));
            $nights = $checkIn->diffInDays($checkOut);

            return new SearchResult(
                id: 'hotel_' . $hotel->id,
                name: $hotel->name,
                type: 'hotel',
                providerCode: $this->getCode(),
                providerItemId: (string)$hotel->id,
                location: [
                    'city' => $hotel->city->name ?? '',
                    'country' => $hotel->city->country->name ?? '',
                    'address' => $hotel->address,
                    'latitude' => $hotel->latitude,
                    'longitude' => $hotel->longitude,
                ],
                pricing: [
                    'base_price' => $minPrice,
                    'currency' => 'INR',
                    'per_night' => $minPrice,
                    'total_estimated' => $minPrice * $nights,
                ],
                availability: [
                    'available' => true,
                    'rooms_available' => $hotel->roomTypes->flatMap->inventory
                        ->where('available_rooms', '>', 0)
                        ->sum('available_rooms'),
                ],
                images: $hotel->getGalleryImages(),
                amenities: $hotel->amenities ?? [],
                metadata: [
                    'star_rating' => $hotel->star_rating,
                    'property_type' => $hotel->property_type,
                    'rating' => $hotel->rating,
                    'review_count' => $hotel->review_count,
                ],
                rating: $hotel->rating ?? 0,
                reviewCount: $hotel->review_count ?? 0,
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
        $hotelId = str_replace('hotel_', '', $itemId);
        $hotel = \App\Models\Hotel::with([
            'roomTypes.rates', 
            'city', 
            'city.region', 
            'city.country'
        ])->where('is_demo', true)->find($hotelId);

        if (!$hotel) return null;

        $checkIn = \Carbon\Carbon::parse($options['check_in'] ?? now()->addDay());
        $checkOut = \Carbon\Carbon::parse($options['check_out'] ?? now()->addDays(2));
        $nights = $checkIn->diffInDays($checkOut);

        $roomTypes = $hotel->roomTypes->map(function ($roomType) use ($checkIn, $checkOut, $nights) {
            $inventory = $roomType->inventory()
                ->whereBetween('date', [$checkIn, $checkOut->copy()->subDay()])
                ->where('available_rooms', '>', 0)
                ->where('is_closed', false)
                ->get();

            $avgPrice = $inventory->avg('sell_price') ?? 0;
            $totalRooms = $inventory->sum('available_rooms');

            return [
                'id' => 'roomtype_' . $roomType->id,
                'name' => $roomType->name,
                'description' => $roomType->description,
                'max_occupancy' => $roomType->max_occupancy,
                'bed_configuration' => $roomType->bed_configuration,
                'amenities' => $roomType->amenities,
                'images' => $roomType->images ?? [],
                'pricing' => [
                    'base_price' => $avgPrice,
                    'currency' => 'INR',
                    'per_night' => $avgPrice,
                    'total' => $avgPrice * $nights,
                ],
                'availability' => [
                    'available' => $totalRooms > 0,
                    'rooms_available' => $totalRooms,
                ],
                'cancellation_policies' => $roomType->rates->map(function ($rate) {
                    return [
                        'rate_id' => $rate->id,
                        'name' => $rate->name,
                        'meal_plan' => $rate->meal_plan,
                        'is_refundable' => $rate->is_refundable,
                        'cancellation_policy' => $rate->cancellation_policy,
                    ];
                })->toArray(),
            ];
        })->filter(fn($rt) => $rt['availability']['available'])->toArray();

        return new ProviderItemDetails(
            id: $itemId,
            name: $hotel->name,
            description: $hotel->description,
            images: $hotel->getGalleryImages(),
            location: [
                'address' => $hotel->address,
                'city' => $hotel->city->name ?? '',
                'country' => $hotel->city->country->name ?? '',
                'latitude' => $hotel->latitude,
                'longitude' => $hotel->longitude,
            ],
            amenities: $hotel->amenities ?? [],
            pricing: [
                'currency' => 'INR',
                'room_types' => $roomTypes,
            ],
            policies: $hotel->policies ?? [],
            availability: [
                'check_in' => $hotel->getCheckInTime(),
                'check_out' => $hotel->getCheckOutTime(),
            ],
            metadata: [
                'star_rating' => $hotel->star_rating,
                'property_type' => $hotel->property_type,
                'rating' => $hotel->rating,
                'review_count' => $hotel->review_count,
                'rating_breakdown' => $hotel->rating_breakdown,
            ],
        );
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        $details = $this->getDetails($itemId, $criteria);
        if (!$details) {
            return new AvailabilityResult(false, 0, 0, 'INR');
        }

        $roomTypeId = $criteria['room_type_id'] ?? null;
        $roomType = $roomTypeId 
            ? \App\Models\HotelRoomType::find(str_replace('roomtype_', '', $roomTypeId))
            : collect($details->getPricing()['room_types'] ?? [])->first();

        if (!$roomType) {
            return new AvailabilityResult(false, 0, 0, 'INR');
        }

        $available = $roomType['availability']['available'] ?? false;
        $quantity = $roomType['availability']['rooms_available'] ?? 0;
        $price = $roomType['pricing']['per_night'] ?? 0;

        return new AvailabilityResult(
            available: $available,
            availableQuantity: $quantity,
            price: $price,
            currency: 'INR',
            holdExpiresAt: now()->addMinutes(config('booking.hold_duration_minutes', 15))
        );
    }

    public function createHold(array $bookingData): HoldResult
    {
        $holdReference = 'HOLD-' . strtoupper(\Illuminate\Support\Str::random(10));
        $expiresAt = now()->addMinutes(config('booking.hold_duration_minutes', 15));

        // In demo mode, we just simulate a hold
        return new HoldResult(
            holdReference: $holdReference,
            expiresAt: $expiresAt,
            heldItems: $bookingData['items'] ?? [],
            successful: true
        );
    }

    public function confirmBooking(string $holdReference, array $bookingData): BookingConfirmation
    {
        $providerReference = 'DEMO-HTL-' . strtoupper(\Illuminate\Support\Str::random(8));
        
        return new BookingConfirmation(
            bookingReference: $bookingData['booking_reference'] ?? 'EVR-HTL-' . strtoupper(\Illuminate\Support\Str::random(6)),
            providerReference: $providerReference,
            confirmationDetails: [
                'provider' => $this->getCode(),
                'confirmed_at' => now()->toISOString(),
            ],
            successful: true
        );
    }

    public function cancelBooking(string $bookingReference, array $options = []): CancellationResult
    {
        return new CancellationResult(
            successful: true,
            refundAmount: $options['refund_amount'] ?? 0,
            cancellationFee: $options['cancellation_fee'] ?? 0,
            providerCancellationReference: 'CAN-' . strtoupper(\Illuminate\Support\Str::random(8))
        );
    }

    public function getBookingStatus(string $bookingReference): BookingStatus
    {
        return new BookingStatus('confirmed', 'confirmed', []);
    }

    public function processRefund(string $bookingReference, float $amount, string $reason): RefundResult
    {
        return new RefundResult(
            successful: true,
            refundReference: 'REF-' . strtoupper(\Illuminate\Support\Str::random(8)),
            processedAmount: $amount,
            estimatedCompletion: now()->addDays(3)
        );
    }
}