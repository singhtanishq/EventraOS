<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyAccount extends Model
{
    protected $fillable = [
        'customer_id', 'points_balance', 'points_pending', 'points_lifetime_earned',
        'points_lifetime_redeemed', 'points_expired', 'tier', 'tier_achieved_at', 'tier_expires_at',
    ];

    protected $casts = [
        'tier_achieved_at' => 'datetime',
        'tier_expires_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class);
    }
}
