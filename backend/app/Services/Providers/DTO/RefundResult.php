<?php

namespace App\Services\Providers\DTO;

class RefundResult
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
}
