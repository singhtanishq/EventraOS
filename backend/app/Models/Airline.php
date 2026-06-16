<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Airline extends Model
{
    protected $fillable = [
        'uuid', 'provider_id', 'provider_airline_id', 'name', 'code', 'icao_code',
        'logo', 'country_id', 'is_active', 'is_low_cost', 'is_demo', 'metadata',
    ];

    protected $casts = ['is_active' => 'boolean', 'is_low_cost' => 'boolean', 'is_demo' => 'boolean', 'metadata' => 'array'];

    protected static function booted(): void
    {
        static::creating(function ($a) { $a->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }
}
