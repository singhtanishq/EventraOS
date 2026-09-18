<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenueRoom extends Model
{
    protected $fillable = [
        'venue_id', 'uuid', 'provider_id', 'name', 'slug', 'description',
        'capacity_theater', 'capacity_banquet', 'capacity_classroom', 'capacity_boardroom',
        'capacity_u_shape', 'capacity_cocktail', 'area_sqm', 'ceiling_height',
        'has_ac', 'has_stage', 'has_projector', 'has_sound_system', 'has_wifi',
        'amenities', 'images', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'amenities' => 'array', 'images' => 'array',
        'has_ac' => 'boolean', 'has_stage' => 'boolean', 'has_projector' => 'boolean',
        'has_sound_system' => 'boolean', 'has_wifi' => 'boolean', 'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($r) {
            $r->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $r->slug ??= \Illuminate\Support\Str::slug($r->name) . '-' . \Illuminate\Support\Str::random(4);
        });
    }

    public function venue(): BelongsTo { return $this->belongsTo(Venue::class); }
}
