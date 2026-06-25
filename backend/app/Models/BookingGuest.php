<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingGuest extends Model
{
    protected $table = 'booking_guests';

    use HasFactory;

    protected $fillable = [
        'booking_id',
        'booking_item_id',
        'saved_traveler_id',
        'title',
        'first_name',
        'middle_name',
        'last_name',
        'date_of_birth',
        'gender',
        'nationality',
        'email',
        'phone',
        'passport_number',
        'passport_expiry',
        'passport_issuing_country',
        'visa_number',
        'visa_expiry',
        'special_requirements',
        'is_primary',
        'is_lead_guest',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'passport_expiry' => 'date',
        'visa_expiry' => 'date',
        'special_requirements' => 'array',
        'is_primary' => 'boolean',
        'is_lead_guest' => 'boolean',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function bookingItem(): BelongsTo
    {
        return $this->belongsTo(BookingItem::class);
    }

    public function savedTraveler(): BelongsTo
    {
        return $this->belongsTo(SavedTraveler::class);
    }

    public function getFullNameAttribute(): string
    {
        $parts = array_filter([$this->title, $this->first_name, $this->middle_name, $this->last_name]);
        return implode(' ', $parts);
    }

    public function getAgeAttribute(): ?int
    {
        if (!$this->date_of_birth) return null;
        return $this->date_of_birth->age;
    }

    public function isAdult(): bool
    {
        $age = $this->age;
        return $age !== null && $age >= 18;
    }
}