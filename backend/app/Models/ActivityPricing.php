<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityPricing extends Model
{
    protected $fillable = ['activity_id', 'schedule_id', 'provider_id', 'name', 'participant_type', 'min_age', 'max_age', 'price', 'currency', 'is_active'];
    protected $casts = ['price' => 'decimal:4', 'is_active' => 'boolean'];

    public function activity(): BelongsTo { return $this->belongsTo(Activity::class); }
}
