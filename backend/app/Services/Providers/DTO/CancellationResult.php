<?php

namespace App\Services\Providers\DTO;

class CancellationResult
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
}
