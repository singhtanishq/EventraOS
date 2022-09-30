<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarInventory extends Model
{
    protected $fillable = ['car_id', 'rate_id', 'date', 'status', 'booking_id', 'price_override'];
    protected $casts = ['date' => 'date', 'price_override' => 'decimal:4'];

    public function car(): BelongsTo { return $this->belongsTo(Car::class); }
}
