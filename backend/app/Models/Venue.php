<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venue extends Model
{
    protected $fillable = [
        'uuid', 'provider_id', 'provider_venue_id', 'name', 'slug', 'description',
        'city_id', 'address', 'latitude', 'longitude', 'landmark', 'phone',
        'email', 'website', 'total_capacity', 'capacity_breakdown', 'venue_types',
        'has_indoor', 'has_outdoor', 'has_parking', 'parking_capacity',
        'has_catering', 'has_av', 'has_stage', 'has_green_room', 'has_bride_groom_room',
        'amenities', 'facilities', 'images', 'floor_plans', 'policies', 'timezone',
        'allows_external_catering', 'allows_external_decor', 'allows_alcohol',
        'earliest_event_time', 'latest_event_time', 'rating', 'review_count',
        'is_active', 'is_featured', 'is_demo', 'sort_order', 'metadata',
    ];

    protected $casts = [
        'latitude' => 'decimal:7', 'longitude' => 'decimal:7',
        'capacity_breakdown' => 'array', 'venue_types' => 'array',
        'amenities' => 'array', 'facilities' => 'array', 'images' => 'array',
        'floor_plans' => 'array', 'policies' => 'array',
        'has_indoor' => 'boolean', 'has_outdoor' => 'boolean', 'has_parking' => 'boolean',
        'has_catering' => 'boolean', 'has_av' => 'boolean', 'has_stage' => 'boolean',
        'has_green_room' => 'boolean', 'has_bride_groom_room' => 'boolean',
        'allows_external_catering' => 'boolean', 'allows_external_decor' => 'boolean',
        'allows_alcohol' => 'boolean',
        'is_active' => 'boolean', 'is_featured' => 'boolean', 'is_demo' => 'boolean',
        'metadata' => 'array', 'rating' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function ($v) {
            $v->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $v->slug ??= \Illuminate\Support\Str::slug($v->name) . '-' . \Illuminate\Support\Str::random(6);
        });
    }

    public function city(): BelongsTo { return $this->belongsTo(City::class); }
    public function rooms(): HasMany { return $this->hasMany(VenueRoom::class); }
    public function packages(): HasMany { return $this->hasMany(VenuePackage::class); }
    public function addons(): HasMany { return $this->hasMany(VenueAddon::class); }
    public function availability(): HasMany { return $this->hasMany(VenueAvailability::class); }
}
