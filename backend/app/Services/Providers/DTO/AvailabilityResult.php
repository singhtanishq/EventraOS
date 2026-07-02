<?php

namespace App\Services\Providers\DTO;

class AvailabilityResult
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
