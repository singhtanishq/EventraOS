<?php

namespace App\Services\Providers\DTO;

class HoldResult
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
}
