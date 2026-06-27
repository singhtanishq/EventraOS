<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'customer_number',
        'date_of_birth',
        'gender',
        'nationality',
        'passport_number',
        'passport_expiry',
        'passport_issuing_country',
        'address',
        'emergency_contact',
        'travel_preferences',
        'communication_preferences',
        'wallet_balance',
        'wallet_currency',
        'loyalty_points',
        'lifetime_spending',
        'booking_count',
        'completed_booking_count',
        'cancelled_booking_count',
        'first_booking_at',
        'last_booking_at',
        'assigned_agent_id',
        'is_vip',
        'risk_flags',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'passport_expiry' => 'date',
        'address' => 'array',
        'emergency_contact' => 'array',
        'travel_preferences' => 'array',
        'communication_preferences' => 'array',
        'wallet_balance' => 'decimal:4',
        'first_booking_at' => 'datetime',
        'last_booking_at' => 'datetime',
        'is_vip' => 'boolean',
        'risk_flags' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($customer) {
            if (empty($customer->uuid)) {
                $customer->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($customer->customer_number)) {
                $customer->customer_number = 'CUST-' . strtoupper(\Illuminate\Support\Str::random(8));
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'assigned_agent_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function savedTravelers(): HasMany
    {
        return $this->hasMany(SavedTraveler::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function loyaltyAccount(): HasOne
    {
        return $this->hasOne(LoyaltyAccount::class);
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function getFullNameAttribute(): string
    {
        return $this->user->name ?? '';
    }

    public function getEmailAttribute(): string
    {
        return $this->user->email ?? '';
    }

    public function getPhoneAttribute(): string
    {
        return $this->user->phone ?? '';
    }
}