<?php

namespace App\Services\Providers\DTO;

class BookingStatus
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
}
