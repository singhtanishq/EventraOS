<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'uuid', 'notifiable_type', 'notifiable_id', 'type', 'title', 'message',
        'channel', 'priority', 'data', 'action_url', 'is_read', 'read_at',
        'is_sent', 'sent_at', 'sent_via', 'delivery_status',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'is_sent' => 'boolean',
        'read_at' => 'datetime',
        'sent_at' => 'datetime',
        'delivery_status' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($n) {
            $n->uuid ??= (string) \Illuminate\Support\Str::uuid();
        });
    }

    public function notifiable()
    {
        return $this->morphTo();
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
}
