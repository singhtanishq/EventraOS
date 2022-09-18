<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = [
        'uuid', 'customer_id', 'booking_id', 'booking_item_id', 'provider_id',
        'service_type', 'service_id', 'overall_rating', 'ratings', 'title',
        'comment', 'photos', 'status', 'is_verified', 'is_anonymous',
        'moderated_by', 'moderated_at', 'moderation_reason', 'response',
        'responded_at', 'helpful_count', 'unhelpful_count', 'metadata',
    ];

    protected $casts = [
        'ratings' => 'array',
        'photos' => 'array',
        'is_verified' => 'boolean',
        'is_anonymous' => 'boolean',
        'moderated_at' => 'datetime',
        'responded_at' => 'datetime',
        'response' => 'array',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($review) {
            $review->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $review->is_verified = true; // Only reachable via completed booking
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
