<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'uuid', 'transaction_reference', 'wallet_id', 'customer_id', 'type', 'status',
        'amount', 'balance_before', 'balance_after', 'currency', 'description',
        'related_booking_id', 'related_refund_id', 'related_payment_id', 'metadata', 'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
        'balance_before' => 'decimal:4',
        'balance_after' => 'decimal:4',
        'metadata' => 'array',
        'completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($txn) {
            $txn->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $txn->transaction_reference ??= 'WLT-' . strtoupper(\Illuminate\Support\Str::random(10));
        });
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }
}
