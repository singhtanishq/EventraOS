<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commission extends Model
{
    protected $fillable = [
        'uuid', 'commission_reference', 'booking_id', 'booking_item_id',
        'agent_id', 'customer_id', 'provider_id', 'status', 'booking_amount',
        'commission_rate', 'commission_amount', 'tax_amount', 'net_commission',
        'currency', 'commission_type', 'calculation_details', 'eligible_date',
        'approved_at', 'approved_by', 'paid_at', 'paid_by', 'payout_reference',
        'reversed_at', 'reversal_reason', 'reversed_by', 'metadata',
    ];

    protected $casts = [
        'booking_amount' => 'decimal:4',
        'commission_rate' => 'decimal:4',
        'commission_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'net_commission' => 'decimal:4',
        'calculation_details' => 'array',
        'metadata' => 'array',
        'eligible_date' => 'date',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($c) {
            $c->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $c->commission_reference ??= 'COM-' . strtoupper(\Illuminate\Support\Str::random(10));
        });
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
