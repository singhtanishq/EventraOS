<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusOperator extends Model
{
    protected $fillable = ['uuid', 'provider_id', 'name', 'code', 'logo', 'contact_phone', 'contact_email', 'is_active', 'is_demo', 'metadata'];
    protected $casts = ['is_active' => 'boolean', 'is_demo' => 'boolean', 'metadata' => 'array'];

    protected static function booted(): void
    {
        static::creating(function ($b) { $b->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }
}
