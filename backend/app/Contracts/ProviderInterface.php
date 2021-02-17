<?php

namespace App\Contracts;

interface ProviderInterface
{
    /**
     * Get the provider type (hotel, flight, train, bus, venue, car, activity, transfer)
     */
    public function getType(): string;

    /**
     * Get the provider code/identifier
     */
    public function getCode(): string;

    /**
     * Check if provider is available/healthy
     */
    public function isAvailable(): bool;

    /**
     * Get provider capabilities
     */
    public function getCapabilities(): array;

    /**
     * Search for inventory
     */
    public function search(array $criteria): SearchResultCollection;

    /**
     * Get detailed information for a specific item
     */
    public function getDetails(string $itemId, array $options = []): ?ProviderItemDetails;

    /**
     * Check real-time availability
     */
    public function checkAvailability(string $itemId, array $criteria): AvailabilityResult;

    /**
     * Create a booking hold/reservation
     */
    public function createHold(array $bookingData): HoldResult;

    /**
     * Confirm a booking
     */
    public function confirmBooking(string $holdReference, array $bookingData): BookingConfirmation;

    /**
     * Cancel a booking
     */
    public function cancelBooking(string $bookingReference, array $options = []): CancellationResult;

    /**
     * Get booking status
     */
    public function getBookingStatus(string $bookingReference): BookingStatus;

    /**
     * Process refund
     */
    public function processRefund(string $bookingReference, float $amount, string $reason): RefundResult;
}

interface SearchResultCollection
{
    public function getResults(): array;
    public function getTotalCount(): int;
    public function getProviderCode(): string;
    public function hasErrors(): bool;
    public function getErrors(): array;
}

interface ProviderItemDetails
{
    public function getId(): string;
    public function getName(): string;
    public function getDescription(): string;
    public function getImages(): array;
    public function getLocation(): array;
    public function getAmenities(): array;
    public function getPricing(): array;
    public function getPolicies(): array;
    public function getAvailability(): array;
    public function getMetadata(): array;
}

interface AvailabilityResult
{
    public function isAvailable(): bool;
    public function getAvailableQuantity(): int;
    public function getPrice(): float;
    public function getCurrency(): string;
    public function getRestrictions(): array;
    public function getHoldExpiresAt(): ?\DateTimeInterface;
}

interface HoldResult
{
    public function getHoldReference(): string;
    public function getExpiresAt(): \DateTimeInterface;
    public function getHeldItems(): array;
    public function isSuccessful(): bool;
    public function getError(): ?string;
}

interface BookingConfirmation
{
    public function getBookingReference(): string;
    public function getProviderReference(): string;
    public function getConfirmationDetails(): array;
    public function isSuccessful(): bool;
    public function getError(): ?string;
}

interface CancellationResult
{
    public function isSuccessful(): bool;
    public function getRefundAmount(): float;
    public function getCancellationFee(): float;
    public function getProviderCancellationReference(): ?string;
    public function getError(): ?string;
}

interface BookingStatus
{
    public function getStatus(): string; // confirmed, cancelled, pending, etc.
    public function getProviderStatus(): string;
    public function getDetails(): array;
    public function isFinal(): bool;
}

interface RefundResult
{
    public function isSuccessful(): bool;
    public function getRefundReference(): string;
    public function getProcessedAmount(): float;
    public function getEstimatedCompletion(): ?\DateTimeInterface;
    public function getError(): ?string;
}