<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentTask extends Model
{
    protected $fillable = [
        'uuid', 'agent_id', 'title', 'description', 'due_date', 'priority',
        'status', 'customer_id', 'booking_id', 'assigned_by', 'completed_at', 'metadata',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($t) {
            $t->uuid ??= (string) \Illuminate\Support\Str::uuid();
        });
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
