<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Promotion extends Model
{
    protected $fillable = [
        'uuid', 'name', 'slug', 'description', 'type', 'value', 'currency',
        'applicable_to', 'service_restrictions', 'destination_restrictions',
        'customer_restrictions', 'agent_restrictions', 'min_booking_value',
        'max_discount_amount', 'usage_limit_total', 'usage_limit_per_customer',
        'usage_limit_per_agent', 'used_count', 'valid_from', 'valid_to',
        'valid_from_time', 'valid_to_time', 'blackout_dates', 'can_stack',
        'requires_promo_code', 'promo_code', 'is_auto_apply', 'priority',
        'is_active', 'is_featured', 'metadata',
    ];

    protected $casts = [
        'value' => 'decimal:4',
        'min_booking_value' => 'integer',
        'max_discount_amount' => 'integer',
        'service_restrictions' => 'array',
        'destination_restrictions' => 'array',
        'customer_restrictions' => 'array',
        'agent_restrictions' => 'array',
        'blackout_dates' => 'array',
        'can_stack' => 'boolean',
        'requires_promo_code' => 'boolean',
        'is_auto_apply' => 'boolean',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'valid_from' => 'date',
        'valid_to' => 'date',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($promotion) {
            $promotion->uuid ??= (string) \Illuminate\Support\Str::uuid();
            if (empty($promotion->slug)) {
                $promotion->slug = \Illuminate\Support\Str::slug($promotion->name) . '-' . \Illuminate\Support\Str::random(4);
            }
        });
    }

    public function coupons(): HasMany
    {
        return $this->hasMany(Coupon::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(PromotionUsage::class);
    }
}
