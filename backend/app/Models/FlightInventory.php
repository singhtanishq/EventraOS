<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlightInventory extends Model
{
    protected $table = 'flight_inventory';

    protected $fillable = [
        'flight_id', 'fare_id', 'date', 'total_seats', 'available_seats',
        'booked_seats', 'blocked_seats', 'base_price', 'sell_price', 'currency',
        'tax_amount', 'fee_amount', 'is_closed', 'seat_map',
    ];

    protected $casts = [
        'date' => 'date', 'base_price' => 'decimal:4', 'sell_price' => 'decimal:4',
        'tax_amount' => 'decimal:4', 'fee_amount' => 'decimal:4',
        'is_closed' => 'boolean', 'seat_map' => 'array',
    ];

    public function flight(): BelongsTo { return $this->belongsTo(Flight::class); }
    public function fare(): BelongsTo { return $this->belongsTo(FlightFare::class); }
}
