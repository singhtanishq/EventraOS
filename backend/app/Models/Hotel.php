<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Hotel extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'provider_id',
        'provider_hotel_id',
        'name',
        'slug',
        'name_local',
        'description',
        'description_local',
        'city_id',
        'address',
        'address_local',
        'latitude',
        'longitude',
        'postal_code',
        'phone',
        'email',
        'website',
        'star_rating',
        'property_type',
        'amenities',
        'room_amenities',
        'property_amenities',
        'policies',
        'check_in_out',
        'images',
        'location_highlights',
        'rating',
        'review_count',
        'rating_breakdown',
        'is_active',
        'is_featured',
        'is_demo',
        'sort_order',
        'metadata',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'star_rating' => 'integer',
        'amenities' => 'array',
        'room_amenities' => 'array',
        'property_amenities' => 'array',
        'policies' => 'array',
        'check_in_out' => 'array',
        'images' => 'array',
        'location_highlights' => 'array',
        'rating' => 'decimal:2',
        'rating_breakdown' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'is_demo' => 'boolean',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($hotel) {
            if (empty($hotel->uuid)) {
                $hotel->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($hotel->slug)) {
                $hotel->slug = \Illuminate\Support\Str::slug($hotel->name) . '-' . \Illuminate\Support\Str::random(6);
            }
        });
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function roomTypes(): HasMany
    {
        return $this->hasMany(HotelRoomType::class)->where('is_active', true)->orderBy('sort_order');
    }

    public function rates(): HasMany
    {
        return $this->hasMany(HotelRate::class)->where('is_active', true);
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(HotelInventory::class);
    }

    public function bookingItems(): HasMany
    {
        return $this->hasMany(BookingItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('service_type', 'hotel');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)->where('is_active', true);
    }

    public function scopeInCity($query, int $cityId)
    {
        return $query->where('city_id', $cityId);
    }

    public function getCheckInTime(): string
    {
        return $this->check_in_out['check_in'] ?? '14:00';
    }

    public function getCheckOutTime(): string
    {
        return $this->check_in_out['check_out'] ?? '11:00';
    }

    public function getMainImage(): ?string
    {
        return $this->images[0] ?? null;
    }

    public function getGalleryImages(): array
    {
        return $this->images ?? [];
    }

}