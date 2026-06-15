<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quote extends Model
{
    protected $fillable = [
        'uuid', 'quote_number', 'agent_id', 'customer_id', 'status',
        'items', 'subtotal', 'tax_total', 'discount_total', 'grand_total',
        'currency', 'valid_until', 'sent_at', 'accepted_at', 'rejected_at',
        'converted_booking_id', 'notes', 'metadata',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'decimal:4',
        'tax_total' => 'decimal:4',
        'discount_total' => 'decimal:4',
        'grand_total' => 'decimal:4',
        'metadata' => 'array',
        'valid_until' => 'datetime',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($q) {
            $q->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $q->quote_number ??= 'QTE-' . strtoupper(\Illuminate\Support\Str::random(10));
        });
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
