<?php

namespace App\Services\Providers\DTO;

class BookingConfirmation
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
}
