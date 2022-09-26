<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenuePackage extends Model
{
    protected $fillable = [
        'venue_id', 'uuid', 'provider_id', 'name', 'slug', 'type', 'description',
        'includes', 'excludes', 'min_guests', 'max_guests', 'price_per_guest',
        'fixed_price', 'price_per_hour', 'currency', 'menu_options', 'decor_options',
        'av_options', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'includes' => 'array', 'excludes' => 'array',
        'menu_options' => 'array', 'decor_options' => 'array', 'av_options' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($p) {
            $p->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $p->slug ??= \Illuminate\Support\Str::slug($p->name) . '-' . \Illuminate\Support\Str::random(4);
        });
    }

    public function venue(): BelongsTo { return $this->belongsTo(Venue::class); }
}
