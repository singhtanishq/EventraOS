<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'uuid', 'invoice_number', 'invoice_type', 'booking_id', 'customer_id',
        'payment_id', 'billing_details', 'line_items', 'subtotal', 'tax_total',
        'discount_total', 'grand_total', 'currency', 'status', 'issued_at',
        'due_at', 'paid_at', 'pdf_path', 'metadata',
    ];

    protected $casts = [
        'billing_details' => 'array',
        'line_items' => 'array',
        'subtotal' => 'decimal:4',
        'tax_total' => 'decimal:4',
        'discount_total' => 'decimal:4',
        'grand_total' => 'decimal:4',
        'metadata' => 'array',
        'issued_at' => 'datetime',
        'due_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($invoice) {
            $invoice->uuid ??= (string) \Illuminate\Support\Str::uuid();
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
