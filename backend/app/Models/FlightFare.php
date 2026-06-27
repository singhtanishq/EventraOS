<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FlightFare extends Model
{
    protected $table = 'flight_fares';

    protected $fillable = [
        'flight_id', 'provider_id', 'provider_fare_id', 'name', 'code',
        'cabin_class', 'baggage_allowance', 'fare_rules', 'is_refundable',
        'is_changeable', 'change_fee', 'cancel_fee', 'is_active',
    ];

    protected $casts = [
        'baggage_allowance' => 'array', 'fare_rules' => 'array',
        'is_refundable' => 'boolean', 'is_changeable' => 'boolean', 'is_active' => 'boolean',
        'change_fee' => 'decimal:4', 'cancel_fee' => 'decimal:4',
    ];

    public function flight(): BelongsTo { return $this->belongsTo(Flight::class); }
    public function inventory(): HasMany { return $this->hasMany(FlightInventory::class, 'fare_id'); }
}
