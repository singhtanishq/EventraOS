<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Airport extends Model
{
    protected $fillable = [
        'city_id', 'name', 'iata_code', 'icao_code', 'latitude', 'longitude',
        'timezone', 'terminal_info', 'is_international', 'is_active',
    ];

    protected $casts = ['latitude' => 'decimal:7', 'longitude' => 'decimal:7', 'is_international' => 'boolean', 'is_active' => 'boolean'];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
