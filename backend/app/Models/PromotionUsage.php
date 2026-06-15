<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionUsage extends Model
{
    protected $fillable = [
        'promotion_id', 'coupon_id', 'booking_id', 'customer_id', 'agent_id',
        'discount_applied', 'currency',
    ];

    protected $casts = ['discount_applied' => 'decimal:4'];

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }
}
