<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyTransaction extends Model
{
    protected $table = 'loyalty_transactions';

    protected $fillable = [
        'uuid', 'transaction_reference', 'loyalty_account_id', 'type', 'status',
        'points', 'balance_before', 'balance_after', 'description',
        'related_booking_id', 'related_payment_id', 'booking_amount', 'earn_rate',
        'expires_at', 'completed_at', 'metadata',
    ];

    protected $casts = [
        'booking_amount' => 'decimal:4',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($txn) {
            $txn->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $txn->transaction_reference ??= 'LOY-' . strtoupper(\Illuminate\Support\Str::random(10));
        });
    }

    public function loyaltyAccount(): BelongsTo
    {
        return $this->belongsTo(LoyaltyAccount::class);
    }
}
