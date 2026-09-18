<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackageInventory extends Model
{
    protected $table = 'package_inventory';

    protected $fillable = ['package_id', 'pricing_id', 'start_date', 'end_date', 'total_slots', 'available_slots', 'booked_slots', 'price_override', 'is_closed'];
    protected $casts = ['start_date' => 'date', 'end_date' => 'date', 'price_override' => 'decimal:4', 'is_closed' => 'boolean'];

    public function package(): BelongsTo { return $this->belongsTo(TravelPackage::class, 'package_id'); }
}
