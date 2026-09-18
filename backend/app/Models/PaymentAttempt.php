<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAttempt extends Model
{
    protected $fillable = [
        'payment_id', 'attempt_number', 'status', 'request', 'response',
        'error_code', 'error_message', 'duration_ms', 'started_at', 'completed_at',
    ];

    protected $casts = ['request' => 'array', 'response' => 'array', 'started_at' => 'datetime', 'completed_at' => 'datetime'];

    public function payment(): BelongsTo { return $this->belongsTo(Payment::class); }
}
