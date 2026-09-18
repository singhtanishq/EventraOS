<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlightSegment extends Model
{
    protected $fillable = [
        'flight_id', 'segment_number', 'departure_airport_id', 'arrival_airport_id',
        'departure_date', 'departure_time', 'arrival_date', 'arrival_time',
        'duration_minutes', 'aircraft_code', 'operating_carrier', 'marketing_carrier',
    ];

    protected $casts = ['departure_date' => 'date', 'arrival_date' => 'date'];

    public function flight(): BelongsTo { return $this->belongsTo(Flight::class); }
}
