<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    protected $fillable = [
        'uuid', 'template_id', 'template_key', 'to_email', 'to_name', 'subject',
        'status', 'provider', 'provider_message_id', 'error_message', 'metadata',
        'sent_at', 'delivered_at', 'opened_at', 'clicked_at',
    ];

    protected $casts = ['metadata' => 'array', 'sent_at' => 'datetime', 'delivered_at' => 'datetime', 'opened_at' => 'datetime', 'clicked_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function ($e) { $e->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }
}
