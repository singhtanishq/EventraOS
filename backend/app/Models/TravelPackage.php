<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TravelPackage extends Model
{
    protected $table = 'travel_packages';

    protected $fillable = [
        'uuid', 'provider_id', 'name', 'slug', 'description', 'short_description',
        'destinations', 'includes', 'excludes', 'itinerary', 'duration_nights',
        'duration_days', 'min_participants', 'max_participants', 'images', 'highlights',
        'cancellation_policy', 'rating', 'review_count', 'is_active', 'is_featured',
        'is_demo', 'sort_order', 'metadata',
    ];

    protected $casts = [
        'destinations' => 'array', 'includes' => 'array', 'excludes' => 'array',
        'itinerary' => 'array', 'images' => 'array', 'highlights' => 'array',
        'cancellation_policy' => 'array', 'metadata' => 'array',
        'is_active' => 'boolean', 'is_featured' => 'boolean', 'is_demo' => 'boolean',
        'rating' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function ($p) {
            $p->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $p->slug ??= \Illuminate\Support\Str::slug($p->name) . '-' . \Illuminate\Support\Str::random(6);
        });
    }

    public function items(): HasMany { return $this->hasMany(PackageItem::class); }
    public function pricing(): HasMany { return $this->hasMany(PackagePricing::class, 'package_id'); }
}
