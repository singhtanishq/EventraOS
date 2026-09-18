<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingHold extends Model
{
    protected $table = 'booking_holds';

    use HasFactory;

    protected $fillable = [
        'booking_id',
        'booking_item_id',
        'provider_id',
        'provider_hold_reference',
        'expires_at',
        'status',
        'held_inventory',
        'released_at',
        'release_reason',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'held_inventory' => 'array',
        'released_at' => 'datetime',
    ];

    public static array $statuses = [
        'active', 'expired', 'confirmed', 'released', 'failed'
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function bookingItem(): BelongsTo
    {
        return $this->belongsTo(BookingItem::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expires_at->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || $this->expires_at->isPast();
    }

    public function release(string $reason = 'Manual release'): void
    {
        $this->update([
            'status' => 'released',
            'released_at' => now(),
            'release_reason' => $reason,
        ]);
    }

    public function confirm(string $providerConfirmationNumber = null): void
    {
        $this->update([
            'status' => 'confirmed',
            'provider_hold_reference' => $providerConfirmationNumber ?? $this->provider_hold_reference,
        ]);
    }
}