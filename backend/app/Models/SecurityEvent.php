<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SecurityEvent extends Model
{
    protected $table = 'security_events';

    protected $fillable = [
        'uuid', 'user_id', 'event_type', 'severity', 'ip_address', 'user_agent',
        'location', 'details', 'is_resolved', 'resolved_by', 'resolved_at', 'resolution_notes',
    ];

    protected $casts = ['details' => 'array', 'is_resolved' => 'boolean', 'resolved_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function ($e) { $e->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }
}
