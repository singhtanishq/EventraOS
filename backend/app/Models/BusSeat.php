<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusSeat extends Model
{
    protected $fillable = ['bus_inventory_id', 'seat_number', 'row_number', 'column_position', 'seat_type', 'status', 'price'];
    protected $casts = ['price' => 'decimal:4'];

    public function busInventory(): BelongsTo { return $this->belongsTo(BusInventory::class); }
}
