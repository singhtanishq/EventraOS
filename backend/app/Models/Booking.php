<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Booking extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'uuid',
        'booking_reference',
        'booking_number',
        'customer_id',
        'agent_id',
        'admin_id',
        'booking_source',
        'status',
        'payment_status',
        'subtotal',
        'tax_total',
        'fee_total',
        'service_fee_total',
        'discount_total',
        'loyalty_discount',
        'wallet_discount',
        'grand_total',
        'amount_paid',
        'amount_refunded',
        'currency',
        'base_currency',
        'exchange_rate',
        'exchange_rate_details',
        'promo_code',
        'promotion_id',
        'price_snapshot',
        'policy_snapshot',
        'special_requests',
        'internal_notes',
        'customer_notes',
        'hold_expires_at',
        'payment_due_at',
        'confirmed_at',
        'cancelled_at',
        'completed_at',
        'cancelled_by',
        'cancellation_reason',
        'cancellation_details',
    ];

    protected $casts = [
        'subtotal' => 'decimal:4',
        'tax_total' => 'decimal:4',
        'fee_total' => 'decimal:4',
        'service_fee_total' => 'decimal:4',
        'discount_total' => 'decimal:4',
        'loyalty_discount' => 'decimal:4',
        'wallet_discount' => 'decimal:4',
        'grand_total' => 'decimal:4',
        'amount_paid' => 'decimal:4',
        'amount_refunded' => 'decimal:4',
        'exchange_rate' => 'decimal:6',
        'exchange_rate_details' => 'array',
        'price_snapshot' => 'array',
        'policy_snapshot' => 'array',
        'special_requests' => 'array',
        'internal_notes' => 'array',
        'customer_notes' => 'array',
        'cancellation_details' => 'array',
        'hold_expires_at' => 'datetime',
        'payment_due_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public static array $statuses = [
        'draft',
        'held',
        'payment_pending',
        'payment_processing',
        'confirmed',
        'partially_confirmed',
        'cancel_requested',
        'cancelled',
        'reschedule_requested',
        'rescheduled',
        'completed',
        'refund_pending',
        'refunded',
        'failed',
    ];

    public static array $paymentStatuses = [
        'unpaid',
        'partial',
        'paid',
        'refunded',
        'partially_refunded',
        'failed',
        'pending_verification',
    ];

    protected static function booted(): void
    {
        static::creating(function ($booking) {
            if (empty($booking->uuid)) {
                $booking->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($booking->booking_reference)) {
                $booking->booking_reference = $booking->generateBookingReference();
            }
            if (empty($booking->booking_number)) {
                $booking->booking_number = 'BK' . date('Ymd') . strtoupper(\Illuminate\Support\Str::random(6));
            }
        });

        static::updating(function ($booking) {
            if ($booking->isDirty('status')) {
                $booking->handleStatusChange($booking->getOriginal('status'), $booking->status);
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['booking_reference', 'status', 'payment_status', 'grand_total', 'amount_paid'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BookingItem::class)->orderBy('sort_order');
    }

    public function guests(): HasMany
    {
        return $this->hasMany(BookingGuest::class);
    }

    public function holds(): HasMany
    {
        return $this->hasMany(BookingHold::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function cancellations(): HasMany
    {
        return $this->hasMany(Cancellation::class);
    }

    public function reschedules(): HasMany
    {
        return $this->hasMany(Reschedule::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function generateBookingReference(): string
    {
        $prefixes = [
            'hotel' => 'HTL',
            'flight' => 'FLT',
            'train' => 'TRN',
            'bus' => 'BUS',
            'venue' => 'EVT',
            'car' => 'CAR',
            'activity' => 'ACT',
            'transfer' => 'TRF',
            'package' => 'PKG',
        ];

        // Determine primary service type
        $primaryType = 'HTL'; // default
        $items = $this->items()->get();
        if ($items->count() > 0) {
            $primaryType = $prefixes[$items->first()->item_type] ?? 'HTL';
        }

        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $suffix = '';
        for ($i = 0; $i < 6; $i++) {
            $suffix .= $chars[random_int(0, strlen($chars) - 1)];
        }

        return "EVR-{$primaryType}-{$suffix}";
    }

    public function handleStatusChange(string $oldStatus, string $newStatus): void
    {
        $now = now();
        
        match ($newStatus) {
            'confirmed' => $this->confirmed_at = $now,
            'cancelled' => $this->cancelled_at = $now,
            'completed' => $this->completed_at = $now,
            'payment_processing' => $this->payment_due_at = $now->addMinutes(config('booking.payment_timeout_minutes', 10)),
            default => null,
        };
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['draft', 'held', 'payment_pending', 'payment_processing']);
    }

    public function isCancelled(): bool
    {
        return in_array($this->status, ['cancelled', 'cancel_requested']);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['confirmed', 'partially_confirmed']) && !$this->isPastTravel();
    }

    public function canBeRescheduled(): bool
    {
        return in_array($this->status, ['confirmed', 'partially_confirmed']) && !$this->isPastTravel();
    }

    public function isPastTravel(): bool
    {
        $lastServiceDate = $this->items()->max('service_end_date') ?? $this->items()->max('service_date');
        return $lastServiceDate && $lastServiceDate->isPast();
    }

    public function getOutstandingAmount(): float
    {
        return max(0, $this->grand_total - $this->amount_paid);
    }

    public function getFormattedGrandTotal(): string
    {
        return \App\Services\CurrencyService::format($this->grand_total, $this->currency);
    }
}