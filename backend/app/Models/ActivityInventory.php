<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityInventory extends Model
{
    protected $table = 'activity_inventory';

    protected $fillable = ['activity_id', 'schedule_id', 'pricing_id', 'date', 'total_slots', 'available_slots', 'booked_slots', 'price_override', 'is_closed'];
    protected $casts = ['date' => 'date', 'price_override' => 'decimal:4', 'is_closed' => 'boolean'];

    public function activity(): BelongsTo { return $this->belongsTo(Activity::class); }
}
