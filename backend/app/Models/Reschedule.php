<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reschedule extends Model
{
    protected $table = 'reschedules';

    protected $fillable = [
        'uuid', 'reschedule_reference', 'booking_id', 'booking_item_id',
        'customer_id', 'requested_by', 'status', 'original_schedule',
        'requested_schedule', 'confirmed_schedule', 'reason', 'reason_details',
        'change_fee', 'fare_difference', 'refund_amount', 'new_total',
        'currency', 'policy_applied', 'payment_id', 'refund_id',
        'reviewed_by', 'reviewed_at', 'rejection_reason',
        'customer_confirmed_at', 'processed_at', 'metadata',
    ];

    protected $casts = [
        'original_schedule' => 'array',
        'requested_schedule' => 'array',
        'confirmed_schedule' => 'array',
        'reason_details' => 'array',
        'policy_applied' => 'array',
        'change_fee' => 'decimal:4',
        'fare_difference' => 'decimal:4',
        'refund_amount' => 'decimal:4',
        'new_total' => 'decimal:4',
        'metadata' => 'array',
        'reviewed_at' => 'datetime',
        'customer_confirmed_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($r) {
            $r->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $r->reschedule_reference ??= 'RES-' . strtoupper(\Illuminate\Support\Str::random(10));
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
