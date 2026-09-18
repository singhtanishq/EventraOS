<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Refund extends Model
{
    protected $fillable = [
        'uuid', 'refund_reference', 'booking_id', 'booking_item_id', 'payment_id',
        'customer_id', 'provider_id', 'provider_refund_id', 'status', 'refund_type',
        'reason', 'reason_details', 'requested_amount', 'approved_amount',
        'processed_amount', 'fee_deducted', 'net_refund', 'currency',
        'requested_by', 'reviewed_by', 'reviewed_at', 'rejection_reason',
        'processed_at', 'gateway_response', 'metadata',
    ];

    protected $casts = [
        'requested_amount' => 'decimal:4',
        'approved_amount' => 'decimal:4',
        'processed_amount' => 'decimal:4',
        'fee_deducted' => 'decimal:4',
        'net_refund' => 'decimal:4',
        'gateway_response' => 'array',
        'metadata' => 'array',
        'reviewed_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($refund) {
            $refund->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $refund->refund_reference ??= 'REF-' . strtoupper(\Illuminate\Support\Str::random(10));
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RefundItem::class);
    }
}
