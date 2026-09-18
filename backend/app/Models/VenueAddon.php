<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenueAddon extends Model
{
    protected $fillable = [
        'venue_id', 'uuid', 'provider_id', 'name', 'slug', 'category',
        'description', 'pricing_type', 'price', 'currency', 'min_quantity',
        'max_quantity', 'options', 'images', 'is_required', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'options' => 'array', 'images' => 'array',
        'is_required' => 'boolean', 'is_active' => 'boolean', 'price' => 'decimal:4',
    ];

    protected static function booted(): void
    {
        static::creating(function ($a) {
            $a->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $a->slug ??= \Illuminate\Support\Str::slug($a->name) . '-' . \Illuminate\Support\Str::random(4);
        });
    }

    public function venue(): BelongsTo { return $this->belongsTo(Venue::class); }
}
