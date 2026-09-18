<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusTerminal extends Model
{
    protected $table = 'bus_terminals';

    protected $fillable = ['city_id', 'name', 'code', 'address', 'latitude', 'longitude', 'amenities', 'is_active'];
    protected $casts = ['latitude' => 'decimal:7', 'longitude' => 'decimal:7', 'amenities' => 'array', 'is_active' => 'boolean'];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
