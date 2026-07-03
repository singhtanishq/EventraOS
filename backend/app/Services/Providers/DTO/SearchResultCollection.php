<?php

namespace App\Services\Providers\DTO;

class SearchResultCollection
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
            'results' => array_map(fn ($r) => $r->toArray(), $this->results),
            'total_count' => $this->totalCount,
            'provider_code' => $this->providerCode,
            'has_errors' => $this->hasErrors(),
            'errors' => $this->errors,
        ];
    }
}
