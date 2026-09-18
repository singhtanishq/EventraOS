<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    protected $fillable = [
        'uuid', 'provider_id', 'provider_activity_id', 'category_id', 'city_id',
        'name', 'slug', 'description', 'short_description', 'address',
        'latitude', 'longitude', 'meeting_point', 'meeting_point_details',
        'duration_minutes', 'duration_type', 'min_participants', 'max_participants',
        'inclusions', 'exclusions', 'requirements', 'what_to_bring', 'images',
        'highlights', 'itinerary', 'cancellation_policy', 'age_restrictions',
        'is_wheelchair_accessible', 'is_private', 'has_guide', 'guide_languages',
        'rating', 'review_count', 'is_active', 'is_featured', 'is_demo', 'sort_order', 'metadata',
    ];

    protected $casts = [
        'latitude' => 'decimal:7', 'longitude' => 'decimal:7',
        'inclusions' => 'array', 'exclusions' => 'array', 'requirements' => 'array',
        'what_to_bring' => 'array', 'images' => 'array', 'highlights' => 'array',
        'itinerary' => 'array', 'cancellation_policy' => 'array', 'age_restrictions' => 'array',
        'guide_languages' => 'array', 'metadata' => 'array',
        'is_wheelchair_accessible' => 'boolean', 'is_private' => 'boolean', 'has_guide' => 'boolean',
        'is_active' => 'boolean', 'is_featured' => 'boolean', 'is_demo' => 'boolean',
        'rating' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function ($a) {
            $a->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $a->slug ??= \Illuminate\Support\Str::slug($a->name) . '-' . \Illuminate\Support\Str::random(6);
        });
    }

    public function category(): BelongsTo { return $this->belongsTo(ActivityCategory::class); }
    public function city(): BelongsTo { return $this->belongsTo(City::class); }
    public function schedules(): HasMany { return $this->hasMany(ActivitySchedule::class); }
    public function pricing(): HasMany { return $this->hasMany(ActivityPricing::class); }
}
