<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditNote extends Model
{
    protected $table = 'credit_notes';

    protected $fillable = ['uuid', 'credit_note_number', 'invoice_id', 'refund_id', 'booking_id', 'customer_id', 'line_items', 'amount', 'currency', 'reason', 'status', 'issued_at', 'pdf_path', 'metadata'];
    protected $casts = ['line_items' => 'array', 'amount' => 'decimal:4', 'metadata' => 'array', 'issued_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function ($c) { $c->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }
}
