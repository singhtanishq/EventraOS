<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Flight extends Model
{
    protected $fillable = [
        'uuid', 'provider_id', 'provider_flight_id', 'airline_id', 'flight_number',
        'departure_airport_id', 'arrival_airport_id', 'departure_date', 'departure_time',
        'arrival_date', 'arrival_time', 'departure_timezone', 'arrival_timezone',
        'duration_minutes', 'aircraft_code', 'aircraft_name', 'stops', 'stop_details',
        'is_active', 'is_demo', 'metadata',
    ];

    protected $casts = [
        'departure_date' => 'date', 'arrival_date' => 'date',
        'is_active' => 'boolean', 'is_demo' => 'boolean',
        'stop_details' => 'array', 'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($f) { $f->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }

    public function airline(): BelongsTo { return $this->belongsTo(Airline::class); }
    public function departureAirport(): BelongsTo { return $this->belongsTo(Airport::class, 'departure_airport_id'); }
    public function arrivalAirport(): BelongsTo { return $this->belongsTo(Airport::class, 'arrival_airport_id'); }
    public function fares(): HasMany { return $this->hasMany(FlightFare::class); }
    public function segments(): HasMany { return $this->hasMany(FlightSegment::class); }
}
