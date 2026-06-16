<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Station extends Model
{
    protected $fillable = [
        'city_id', 'name', 'code', 'type', 'latitude', 'longitude',
        'timezone', 'platforms', 'is_active',
    ];

    protected $casts = ['latitude' => 'decimal:7', 'longitude' => 'decimal:7', 'platforms' => 'array', 'is_active' => 'boolean'];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
