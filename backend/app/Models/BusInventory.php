<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusInventory extends Model
{
    protected $fillable = ['bus_route_id', 'bus_type_id', 'fare_id', 'journey_date', 'total_seats', 'available_seats', 'booked_seats', 'blocked_seats', 'current_fare', 'seat_status', 'is_cancelled'];
    protected $casts = ['journey_date' => 'date', 'current_fare' => 'decimal:4', 'seat_status' => 'array', 'is_cancelled' => 'boolean'];

    public function busRoute(): BelongsTo { return $this->belongsTo(BusRoute::class); }
    public function busType(): BelongsTo { return $this->belongsTo(BusType::class); }
}
