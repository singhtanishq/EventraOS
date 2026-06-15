<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Coupon extends Model
{
    protected $fillable = [
        'uuid', 'promotion_id', 'code', 'status', 'customer_id', 'agent_id',
        'issued_at', 'used_at', 'used_booking_id', 'expires_at', 'metadata',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($coupon) {
            $coupon->uuid ??= (string) \Illuminate\Support\Str::uuid();
        });
    }

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }
}
