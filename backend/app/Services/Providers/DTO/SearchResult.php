<?php

namespace App\Services\Providers\DTO;

class SearchResult
{
    public function __construct(
        public string $id,
        public string $name,
        public string $type,
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
