<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $fillable = [
        'uuid', 'ticket_number', 'customer_id', 'booking_id', 'booking_item_id',
        'subject', 'description', 'category', 'priority', 'status',
        'assigned_agent_id', 'assigned_admin_id', 'first_response_at',
        'resolved_at', 'closed_at', 'response_count', 'tags', 'metadata',
    ];

    protected $casts = [
        'first_response_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'tags' => 'array',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($ticket) {
            $ticket->uuid ??= (string) \Illuminate\Support\Str::uuid();
            $ticket->ticket_number ??= 'TKT-' . strtoupper(\Illuminate\Support\Str::random(10));
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

    public function messages(): HasMany
    {
        return $this->hasMany(SupportMessage::class);
    }
}
