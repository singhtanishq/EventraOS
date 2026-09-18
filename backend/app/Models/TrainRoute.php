<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrainRoute extends Model
{
    protected $fillable = [
        'uuid', 'provider_id', 'operator_id', 'train_number', 'train_name',
        'origin_station_id', 'destination_station_id', 'intermediate_stations',
        'departure_time', 'arrival_time', 'duration_minutes', 'running_days',
        'train_type', 'is_active', 'is_demo', 'metadata',
    ];

    protected $casts = [
        'intermediate_stations' => 'array', 'running_days' => 'array',
        'is_active' => 'boolean', 'is_demo' => 'boolean', 'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($t) { $t->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }

    public function operator(): BelongsTo { return $this->belongsTo(TrainOperator::class); }
    public function originStation(): BelongsTo { return $this->belongsTo(Station::class, 'origin_station_id'); }
    public function destinationStation(): BelongsTo { return $this->belongsTo(Station::class, 'destination_station_id'); }
    public function classes(): HasMany { return $this->hasMany(TrainClass::class); }
    public function fares(): HasMany { return $this->hasMany(TrainFare::class); }
}
