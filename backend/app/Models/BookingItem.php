<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class BookingItem extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'uuid',
        'booking_id',
        'parent_item_id',
        'item_type',
        'service_id',
        'service_name',
        'service_details',
        'configuration',
        'travelers',
        'service_date',
        'service_end_date',
        'service_time',
        'service_timezone',
        'item_status',
        'provider_id',
        'provider_booking_reference',
        'provider_confirmation_number',
        'base_price',
        'tax_amount',
        'fee_amount',
        'service_fee',
        'discount_amount',
        'addon_total',
        'total_price',
        'currency',
        'cancellation_policy',
        'change_policy',
        'confirmation_deadline',
        'cancelled_at',
        'cancellation_reason',
        'refund_amount',
        'sort_order',
        'metadata',
    ];

    protected $casts = [
        'service_details' => 'array',
        'configuration' => 'array',
        'travelers' => 'array',
        'service_date' => 'date',
        'service_end_date' => 'date',
        'base_price' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'fee_amount' => 'decimal:4',
        'service_fee' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'addon_total' => 'decimal:4',
        'total_price' => 'decimal:4',
        'cancellation_policy' => 'array',
        'change_policy' => 'array',
        'confirmation_deadline' => 'datetime',
        'cancelled_at' => 'datetime',
        'refund_amount' => 'decimal:4',
        'metadata' => 'array',
    ];

    public static array $itemTypes = [
        'hotel', 'flight', 'train', 'bus', 'venue', 'car', 'activity', 'transfer', 'package', 'insurance', 'addon'
    ];

    public static array $itemStatuses = [
        'pending', 'held', 'confirmed', 'partially_confirmed', 'cancelled', 'completed', 'failed', 'refunded'
    ];

    protected static function booted(): void
    {
        static::creating(function ($item) {
            if (empty($item->uuid)) {
                $item->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['item_type', 'item_status', 'total_price', 'provider_booking_reference'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function parentItem(): BelongsTo
    {
        return $this->belongsTo(BookingItem::class, 'parent_item_id');
    }

    public function childItems(): HasMany
    {
        return $this->hasMany(BookingItem::class, 'parent_item_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function guests(): HasMany
    {
        return $this->hasMany(BookingGuest::class);
    }

    public function holds(): HasMany
    {
        return $this->hasMany(BookingHold::class);
    }

    public function cancellations(): HasMany
    {
        return $this->hasMany(Cancellation::class);
    }

    public function reschedules(): HasMany
    {
        return $this->hasMany(Reschedule::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function isConfirmed(): bool
    {
        return $this->item_status === 'confirmed';
    }

    public function isCancelled(): bool
    {
        return $this->item_status === 'cancelled';
    }

    public function getServiceModel(): ?Model
    {
        if (!$this->service_id) return null;

        return match ($this->item_type) {
            'hotel' => Hotel::find($this->service_id),
            'flight' => Flight::find($this->service_id),
            'train' => TrainRoute::find($this->service_id),
            'bus' => BusRoute::find($this->service_id),
            'venue' => Venue::find($this->service_id),
            'car' => Car::find($this->service_id),
            'activity' => Activity::find($this->service_id),
            'transfer' => Transfer::find($this->service_id),
            'package' => TravelPackage::find($this->service_id),
            default => null,
        };
    }

    public function getFormattedTotalPrice(): string
    {
        return \App\Services\CurrencyService::format($this->total_price, $this->currency);
    }
}