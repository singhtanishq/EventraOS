<?php

namespace App\Services\Providers\DTO;

use Illuminate\Support\Collection;

class SearchResultCollection implements \App\Contracts\SearchResultCollection
{
    protected array $results = [];
    protected int $totalCount = 0;
    protected string $providerCode = '';
    protected array $errors = [];

    public function __construct(
        array $results = [],
        int $totalCount = 0,
        string $providerCode = '',
        array $errors = []
    ) {
        $this->results = $results;
        $this->totalCount = $totalCount;
        $this->providerCode = $providerCode;
        $this->errors = $errors;
    }

    public function getResults(): array
    {
        return $this->results;
    }

    public function getTotalCount(): int
    {
        return $this->totalCount;
    }

    public function getProviderCode(): string
    {
        return $this->providerCode;
    }

    public function hasErrors(): bool
    {
        return !empty($this->errors);
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function addResult(SearchResult $result): self
    {
        $this->results[] = $result;
        $this->totalCount++;
        return $this;
    }

    public function merge(SearchResultCollection $other): self
    {
        $this->results = array_merge($this->results, $other->getResults());
        $this->totalCount += $other->getTotalCount();
        $this->errors = array_merge($this->errors, $other->getErrors());
        return $this;
    }

    public function toArray(): array
    {
        return [
            'results' => array_map(fn($r) => $r->toArray(), $this->results),
            'total_count' => $this->totalCount,
            'provider_code' => $this->providerCode,
            'has_errors' => $this->hasErrors(),
            'errors' => $this->errors,
        ];
    }
}

class SearchResult
{
    public function __construct(
        public string $id,
        public string $name,
        public string $type, // hotel, flight, train, bus, venue, car, activity, transfer
        public string $providerCode,
        public string $providerItemId,
        public array $location,
        public array $pricing,
        public array $availability,
        public array $images = [],
        public array $amenities = [],
        public array $metadata = [],
        public float $rating = 0,
        public int $reviewCount = 0,
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'provider_code' => $this->providerCode,
            'provider_item_id' => $this->providerItemId,
            'location' => $this->location,
            'pricing' => $this->pricing,
            'availability' => $this->availability,
            'images' => $this->images,
            'amenities' => $this->amenities,
            'metadata' => $this->metadata,
            'rating' => $this->rating,
            'review_count' => $this->reviewCount,
        ];
    }
}

class ProviderItemDetails implements \App\Contracts\ProviderItemDetails
{
    public function __construct(
        public string $id,
        public string $name,
        public string $description,
        public array $images,
        public array $location,
        public array $amenities,
        public array $pricing,
        public array $policies,
        public array $availability,
        public array $metadata = [],
    ) {}

    public function getId(): string { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getDescription(): string { return $this->description; }
    public function getImages(): array { return $this->images; }
    public function getLocation(): array { return $this->location; }
    public function getAmenities(): array { return $this->amenities; }
    public function getPricing(): array { return $this->pricing; }
    public function getPolicies(): array { return $this->policies; }
    public function getAvailability(): array { return $this->availability; }
    public function getMetadata(): array { return $this->metadata; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'images' => $this->images,
            'location' => $this->location,
            'amenities' => $this->amenities,
            'pricing' => $this->pricing,
            'policies' => $this->policies,
            'availability' => $this->availability,
            'metadata' => $this->metadata,
        ];
    }
}

class AvailabilityResult implements \App\Contracts\AvailabilityResult
{
    public function __construct(
        public bool $available,
        public int $availableQuantity,
        public float $price,
        public string $currency,
        public array $restrictions = [],
        public ?\DateTimeInterface $holdExpiresAt = null,
    ) {}

    public function isAvailable(): bool { return $this->available; }
    public function getAvailableQuantity(): int { return $this->availableQuantity; }
    public function getPrice(): float { return $this->price; }
    public function getCurrency(): string { return $this->currency; }
    public function getRestrictions(): array { return $this->restrictions; }
    public function getHoldExpiresAt(): ?\DateTimeInterface { return $this->holdExpiresAt; }

    public function toArray(): array
    {
        return [
            'available' => $this->available,
            'available_quantity' => $this->availableQuantity,
            'price' => $this->price,
            'currency' => $this->currency,
            'restrictions' => $this->restrictions,
            'hold_expires_at' => $this->holdExpiresAt?->toISOString(),
        ];
    }
}

class HoldResult implements \App\Contracts\HoldResult
{
    public function __construct(
        public string $holdReference,
        public \DateTimeInterface $expiresAt,
        public array $heldItems = [],
        public bool $successful = true,
        public ?string $error = null,
    ) {}

    public function getHoldReference(): string { return $this->holdReference; }
    public function getExpiresAt(): \DateTimeInterface { return $this->expiresAt; }
    public function getHeldItems(): array { return $this->heldItems; }
    public function isSuccessful(): bool { return $this->successful; }
    public function getError(): ?string { return $this->error; }

    public function toArray(): array
    {
        return [
            'hold_reference' => $this->holdReference,
            'expires_at' => $this->expiresAt->toISOString(),
            'held_items' => $this->heldItems,
            'successful' => $this->successful,
            'error' => $this->error,
        ];
    }
}

class BookingConfirmation implements \App\Contracts\BookingConfirmation
{
    public function __construct(
        public string $bookingReference,
        public string $providerReference,
        public array $confirmationDetails = [],
        public bool $successful = true,
        public ?string $error = null,
    ) {}

    public function getBookingReference(): string { return $this->bookingReference; }
    public function getProviderReference(): string { return $this->providerReference; }
    public function getConfirmationDetails(): array { return $this->confirmationDetails; }
    public function isSuccessful(): bool { return $this->successful; }
    public function getError(): ?string { return $this->error; }

    public function toArray(): array
    {
        return [
            'booking_reference' => $this->bookingReference,
            'provider_reference' => $this->providerReference,
            'confirmation_details' => $this->confirmationDetails,
            'successful' => $this->successful,
            'error' => $this->error,
        ];
    }
}

class CancellationResult implements \App\Contracts\CancellationResult
{
    public function __construct(
        public bool $successful,
        public float $refundAmount = 0,
        public float $cancellationFee = 0,
        public ?string $providerCancellationReference = null,
        public ?string $error = null,
    ) {}

    public function isSuccessful(): bool { return $this->successful; }
    public function getRefundAmount(): float { return $this->refundAmount; }
    public function getCancellationFee(): float { return $this->cancellationFee; }
    public function getProviderCancellationReference(): ?string { return $this->providerCancellationReference; }
    public function getError(): ?string { return $this->error; }

    public function toArray(): array
    {
        return [
            'successful' => $this->successful,
            'refund_amount' => $this->refundAmount,
            'cancellation_fee' => $this->cancellationFee,
            'provider_cancellation_reference' => $this->providerCancellationReference,
            'error' => $this->error,
        ];
    }
}

class BookingStatus implements \App\Contracts\BookingStatus
{
    public function __construct(
        public string $status,
        public string $providerStatus,
        public array $details = [],
    ) {}

    public function getStatus(): string { return $this->status; }
    public function getProviderStatus(): string { return $this->providerStatus; }
    public function getDetails(): array { return $this->details; }
    public function isFinal(): bool 
    { 
        return in_array($this->status, ['confirmed', 'cancelled', 'completed', 'failed']); 
    }

    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'provider_status' => $this->providerStatus,
            'details' => $this->details,
            'is_final' => $this->isFinal(),
        ];
    }
}

class RefundResult implements \App\Contracts\RefundResult
{
    public function __construct(
        public bool $successful,
        public string $refundReference,
        public float $processedAmount = 0,
        public ?\DateTimeInterface $estimatedCompletion = null,
        public ?string $error = null,
    ) {}

    public function isSuccessful(): bool { return $this->successful; }
    public function getRefundReference(): string { return $this->refundReference; }
    public function getProcessedAmount(): float { return $this->processedAmount; }
    public function getEstimatedCompletion(): ?\DateTimeInterface { return $this->estimatedCompletion; }
    public function getError(): ?string { return $this->error; }

    public function toArray(): array
    {
        return [
            'successful' => $this->successful,
            'refund_reference' => $this->refundReference,
            'processed_amount' => $this->processedAmount,
            'estimated_completion' => $this->estimatedCompletion?->toISOString(),
            'error' => $this->error,
        ];
    }
}