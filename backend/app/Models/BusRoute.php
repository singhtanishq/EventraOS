<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusRoute extends Model
{
    protected $fillable = [
        'uuid', 'provider_id', 'operator_id', 'origin_terminal_id', 'destination_terminal_id',
        'route_name', 'departure_time', 'arrival_time', 'duration_minutes',
        'boarding_points', 'dropping_points', 'running_days', 'is_active', 'is_demo', 'metadata',
    ];

    protected $casts = [
        'boarding_points' => 'array', 'dropping_points' => 'array', 'running_days' => 'array',
        'is_active' => 'boolean', 'is_demo' => 'boolean', 'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($b) { $b->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }

    public function operator(): BelongsTo { return $this->belongsTo(BusOperator::class); }
    public function originTerminal(): BelongsTo { return $this->belongsTo(BusTerminal::class, 'origin_terminal_id'); }
    public function destinationTerminal(): BelongsTo { return $this->belongsTo(BusTerminal::class, 'destination_terminal_id'); }
    public function types(): HasMany { return $this->hasMany(BusType::class); }
    public function inventory(): HasMany { return $this->hasMany(BusInventory::class); }
}
