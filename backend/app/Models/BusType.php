<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusType extends Model
{
    protected $fillable = ['bus_route_id', 'provider_id', 'name', 'code', 'layout', 'berth_type', 'is_ac', 'total_seats', 'lower_berths', 'upper_berths', 'amenities', 'seat_map', 'is_active'];
    protected $casts = ['amenities' => 'array', 'seat_map' => 'array', 'is_ac' => 'boolean', 'is_active' => 'boolean'];

    public function busRoute(): BelongsTo { return $this->belongsTo(BusRoute::class); }
}
