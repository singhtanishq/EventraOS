<?php

namespace App\Services\Providers;

use App\Services\Providers\DTO\{
    SearchResultCollection,
    AvailabilityResult,
    HoldResult,
    BookingConfirmation,
    CancellationResult,
    BookingStatus,
    RefundResult
};

class DemoCarProvider extends BaseProvider
{
    public function search(array $criteria): SearchResultCollection
    {
        return new SearchResultCollection([], 0, $this->getCode());
    }

    public function getDetails(string $itemId, array $options = []): ?\App\Services\Providers\DTO\ProviderItemDetails
    {
        return null;
    }

    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult
    {
        return new AvailabilityResult(false, 0, 0, 'INR');
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
