<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentTarget extends Model
{
    protected $table = 'agent_targets';

    protected $fillable = ['agent_id', 'period_type', 'period_start', 'period_end', 'booking_target', 'revenue_target', 'commission_target', 'bookings_achieved', 'revenue_achieved', 'commission_achieved', 'milestones', 'is_active'];
    protected $casts = ['period_start' => 'date', 'period_end' => 'date', 'milestones' => 'array', 'is_active' => 'boolean'];

    public function agent(): BelongsTo { return $this->belongsTo(Agent::class); }
}
