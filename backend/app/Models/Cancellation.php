<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cancellation extends Model
{
    protected $table = 'cancellations';

    protected $fillable = [
        'uuid', 'cancellation_reference', 'booking_id', 'booking_item_id',
        'customer_id', 'requested_by', 'status', 'cancellation_type', 'reason',
        'reason_details', 'original_amount', 'refundable_amount',
        'cancellation_fee', 'final_refund', 'currency', 'policy_applied',
        'refund_id', 'reviewed_by', 'reviewed_at', 'rejection_reason',
        'processed_at', 'metadata',
    ];

    protected $casts = [
        'original_amount' => 'decimal:4',
        'refundable_amount' => 'decimal:4',
        'cancellation_fee' => 'decimal:4',
        'final_refund' => 'decimal:4',
        'policy_applied' => 'array',
        'reason_details' => 'array',
        'metadata' => 'array',
        'reviewed_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($c) {
            $c->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $c->cancellation_reference ??= 'CAN-' . strtoupper(\Illuminate\Support\Str::random(10));
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
