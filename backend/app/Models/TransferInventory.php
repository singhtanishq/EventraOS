<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferInventory extends Model
{
    protected $fillable = ['transfer_id', 'pricing_id', 'date', 'time_slot', 'total_vehicles', 'available_vehicles', 'booked_vehicles', 'price_override', 'is_closed'];
    protected $casts = ['date' => 'date', 'price_override' => 'decimal:4', 'is_closed' => 'boolean'];

    public function transfer(): BelongsTo { return $this->belongsTo(Transfer::class); }
}
