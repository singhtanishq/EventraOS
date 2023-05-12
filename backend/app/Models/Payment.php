<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'payment_reference',
        'payment_number',
        'booking_id',
        'customer_id',
        'payment_method_id',
        'customer_payment_method_id',
        'provider_id',
        'provider_payment_id',
        'provider_order_id',
        'status',
        'amount',
        'fee_amount',
        'net_amount',
        'currency',
        'base_currency',
        'exchange_rate',
        'idempotency_key',
        'gateway_request',
        'gateway_response',
        'gateway_status',
        'failure_reason',
        'failure_details',
        'initiated_at',
        'processed_at',
        'authorized_at',
        'captured_at',
        'failed_at',
        'refunded_at',
        'expires_at',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
        'fee_amount' => 'decimal:4',
        'net_amount' => 'decimal:4',
        'exchange_rate' => 'decimal:6',
        'gateway_request' => 'array',
        'gateway_response' => 'array',
        'failure_details' => 'array',
        'initiated_at' => 'datetime',
        'processed_at' => 'datetime',
        'authorized_at' => 'datetime',
        'captured_at' => 'datetime',
        'failed_at' => 'datetime',
        'refunded_at' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    public static array $statuses = [
        'initiated', 'processing', 'authorized', 'captured', 'failed',
        'cancelled', 'refunded', 'partially_refunded', 'pending_verification', 'expired'
    ];

    protected static function booted(): void
    {
        static::creating(function ($payment) {
            if (empty($payment->uuid)) {
                $payment->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($payment->payment_reference)) {
                $payment->payment_reference = 'PAY-' . strtoupper(\Illuminate\Support\Str::random(10));
            }
            if (empty($payment->payment_number)) {
                $payment->payment_number = 'P' . date('YmdHis') . strtoupper(\Illuminate\Support\Str::random(4));
            }
            if (empty($payment->idempotency_key)) {
                $payment->idempotency_key = 'pay_' . \Illuminate\Support\Str::uuid();
            }
            if (empty($payment->initiated_at)) {
                $payment->initiated_at = now();
            }
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function customerPaymentMethod(): BelongsTo
    {
        return $this->belongsTo(CustomerPaymentMethod::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function isSuccessful(): bool
    {
        return in_array($this->status, ['authorized', 'captured']);
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['initiated', 'processing', 'pending_verification']);
    }

    public function isFailed(): bool
    {
        return in_array($this->status, ['failed', 'cancelled', 'expired']);
    }

    public function canBeRefunded(): bool
    {
        return in_array($this->status, ['captured', 'authorized']) && $this->amount > 0;
    }

    public function getRemainingRefundableAmount(): float
    {
        $refunded = $this->refunds()->where('status', 'completed')->sum('processed_amount');
        return max(0, $this->amount - $refunded);
    }

    public function markProcessing(): void
    {
        $this->update(['status' => 'processing', 'processed_at' => now()]);
    }

    public function markAuthorized(string $providerPaymentId = null, array $gatewayResponse = []): void
    {
        $this->update([
            'status' => 'authorized',
            'provider_payment_id' => $providerPaymentId,
            'gateway_response' => $gatewayResponse,
            'authorized_at' => now(),
        ]);
    }

    public function markCaptured(array $gatewayResponse = []): void
    {
        $this->update([
            'status' => 'captured',
            'gateway_response' => array_merge($this->gateway_response ?? [], $gatewayResponse),
            'captured_at' => now(),
        ]);

        // Update booking payment status
        $this->booking->update(['payment_status' => 'paid']);
    }

    public function markFailed(string $reason, array $details = []): void
    {
        $this->update([
            'status' => 'failed',
            'failure_reason' => $reason,
            'failure_details' => $details,
            'failed_at' => now(),
        ]);
    }

    public function getFormattedAmount(): string
    {
        return \App\Services\CurrencyService::format($this->amount, $this->currency);
    }
}