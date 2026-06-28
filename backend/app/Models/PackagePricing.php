<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackagePricing extends Model
{
    protected $table = 'package_pricing';

    protected $fillable = ['package_id', 'provider_id', 'name', 'occupancy', 'price', 'currency', 'includes', 'room_configuration', 'is_active'];
    protected $casts = ['price' => 'decimal:4', 'includes' => 'array', 'room_configuration' => 'array', 'is_active' => 'boolean'];

    public function package(): BelongsTo { return $this->belongsTo(TravelPackage::class, 'package_id'); }
}
