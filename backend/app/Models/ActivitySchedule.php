<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivitySchedule extends Model
{
    protected $table = 'activity_schedules';

    protected $fillable = ['activity_id', 'provider_id', 'name', 'start_time', 'end_time', 'days_of_week', 'valid_from', 'valid_to', 'max_participants', 'is_active'];
    protected $casts = ['days_of_week' => 'array', 'valid_from' => 'date', 'valid_to' => 'date', 'is_active' => 'boolean'];

    public function activity(): BelongsTo { return $this->belongsTo(Activity::class); }
}
