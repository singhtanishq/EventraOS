<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferPricing extends Model
{
    protected $fillable = ['transfer_id', 'provider_id', 'name', 'pricing_model', 'base_price', 'per_km_rate', 'per_hour_rate', 'night_surcharge', 'waiting_charge_per_hour', 'extra_luggage_charge', 'currency', 'conditions', 'is_active'];
    protected $casts = ['base_price' => 'decimal:4', 'per_km_rate' => 'decimal:4', 'per_hour_rate' => 'decimal:4', 'night_surcharge' => 'decimal:4', 'waiting_charge_per_hour' => 'decimal:4', 'extra_luggage_charge' => 'decimal:4', 'conditions' => 'array', 'is_active' => 'boolean'];

    public function transfer(): BelongsTo { return $this->belongsTo(Transfer::class); }
}
