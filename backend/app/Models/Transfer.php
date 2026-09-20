<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transfer extends Model
{
    protected $fillable = [
        'uuid', 'provider_id', 'operator_id', 'vehicle_type_id', 'name', 'slug',
        'description', 'transfer_type', 'pickup_location_id', 'dropoff_location_id',
        'pickup_address', 'dropoff_address', 'distance_km', 'estimated_duration_minutes',
        'route_details', 'inclusions', 'exclusions', 'cancellation_policy',
        'is_shared', 'is_active', 'is_demo', 'metadata',
    ];

    protected $casts = [
        'route_details' => 'array', 'inclusions' => 'array', 'exclusions' => 'array',
        'cancellation_policy' => 'array', 'metadata' => 'array',
        'is_shared' => 'boolean', 'is_active' => 'boolean', 'is_demo' => 'boolean',
        'distance_km' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function ($t) {
            $t->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $t->slug ??= \Illuminate\Support\Str::slug($t->name) . '-' . \Illuminate\Support\Str::random(6);
        });
    }

    public function operator(): BelongsTo { return $this->belongsTo(TransferOperator::class); }
    public function vehicleType(): BelongsTo { return $this->belongsTo(TransferVehicleType::class); }
    public function pricing(): HasMany { return $this->hasMany(TransferPricing::class); }
    public function inventory(): HasMany { return $this->hasMany(TransferInventory::class); }
}
