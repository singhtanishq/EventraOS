<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarPickupLocation extends Model
{
    protected $fillable = ['company_id', 'name', 'address', 'latitude', 'longitude', 'phone', 'operating_hours', 'is_airport', 'airport_id', 'is_active'];
    protected $casts = ['latitude' => 'decimal:7', 'longitude' => 'decimal:7', 'operating_hours' => 'array', 'is_airport' => 'boolean', 'is_active' => 'boolean'];

    public function company(): BelongsTo { return $this->belongsTo(CarRentalCompany::class, 'company_id'); }
}
