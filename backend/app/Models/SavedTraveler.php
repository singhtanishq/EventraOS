<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedTraveler extends Model
{
    protected $table = 'saved_travelers';

    protected $fillable = [
        'customer_id', 'uuid', 'title', 'first_name', 'middle_name', 'last_name',
        'date_of_birth', 'gender', 'nationality', 'passport_number',
        'passport_expiry', 'passport_issuing_country', 'email', 'phone',
        'preferences', 'relationship', 'is_default', 'is_active',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'passport_expiry' => 'date',
        'preferences' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($t) {
            $t->uuid ??= (string) \Illuminate\Support\Str::uuid();
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}
