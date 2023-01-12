<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $fillable = [
        'uuid', 'correlation_id', 'actor_id', 'actor_type', 'actor_role',
        'actor_ip', 'actor_user_agent', 'action', 'entity_type', 'entity_id',
        'entity_reference', 'old_values', 'new_values', 'changed_attributes',
        'description', 'metadata', 'severity',
    ];

    protected $casts = ['old_values' => 'array', 'new_values' => 'array', 'changed_attributes' => 'array', 'metadata' => 'array'];

    protected static function booted(): void
    {
        static::creating(function ($l) { $l->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }
}
