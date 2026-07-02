<?php

namespace App\Services\Providers\DTO;

class ProviderItemDetails
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
            'id' => $this->id, 'name' => $this->name, 'description' => $this->description,
            'images' => $this->images, 'location' => $this->location,
            'amenities' => $this->amenities, 'pricing' => $this->pricing,
            'policies' => $this->policies, 'availability' => $this->availability,
            'metadata' => $this->metadata,
        ];
    }
}
