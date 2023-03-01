<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarExport extends Model
{
    protected $table = 'calendar_exports';

    protected $fillable = ['uuid', 'booking_id', 'customer_id', 'export_type', 'token', 'is_active', 'last_accessed_at', 'access_count'];
    protected $casts = ['is_active' => 'boolean', 'last_accessed_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function ($e) { $e->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }
}
