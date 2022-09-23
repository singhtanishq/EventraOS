<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainInventory extends Model
{
    protected $fillable = ['train_route_id', 'class_id', 'fare_id', 'journey_date', 'total_berths', 'available_berths', 'booked_berths', 'rac_count', 'wl_count', 'current_fare', 'is_closed'];
    protected $casts = ['journey_date' => 'date', 'current_fare' => 'decimal:4', 'is_closed' => 'boolean'];

    public function trainRoute(): BelongsTo { return $this->belongsTo(TrainRoute::class); }
    public function trainClass(): BelongsTo { return $this->belongsTo(TrainClass::class, 'class_id'); }
}
