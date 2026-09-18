<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    protected $fillable = ['customer_id', 'balance', 'pending_balance', 'blocked_balance', 'currency', 'last_transaction_at'];

    protected $casts = [
        'balance' => 'decimal:4',
        'pending_balance' => 'decimal:4',
        'blocked_balance' => 'decimal:4',
        'last_transaction_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
