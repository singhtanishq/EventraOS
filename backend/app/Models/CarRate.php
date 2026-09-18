<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarRate extends Model
{
    protected $table = 'car_rates';

    protected $fillable = ['car_id', 'provider_id', 'name', 'rate_type', 'base_rate', 'km_included', 'extra_km_rate', 'driver_allowance', 'insurance_options', 'deposit_amount', 'currency', 'cancellation_policy', 'terms_conditions', 'is_active'];
    protected $casts = ['base_rate' => 'decimal:4', 'extra_km_rate' => 'decimal:4', 'driver_allowance' => 'decimal:4', 'deposit_amount' => 'decimal:4', 'insurance_options' => 'array', 'cancellation_policy' => 'array', 'terms_conditions' => 'array', 'is_active' => 'boolean'];

    public function car(): BelongsTo { return $this->belongsTo(Car::class); }
}
