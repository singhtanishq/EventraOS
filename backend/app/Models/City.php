<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class City extends Model
{
    protected $fillable = [
        'country_id', 'region_id', 'name', 'slug', 'name_local',
        'latitude', 'longitude', 'timezone', 'population',
        'is_popular', 'is_active', 'sort_order', 'metadata',
    ];

    protected $casts = [
        'latitude' => 'decimal:7', 'longitude' => 'decimal:7',
        'is_popular' => 'boolean', 'is_active' => 'boolean', 'metadata' => 'array',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function hotels(): HasMany
    {
        return $this->hasMany(Hotel::class);
    }

    public function venues(): HasMany
    {
        return $this->hasMany(Venue::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }
}
