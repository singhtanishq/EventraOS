<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class HotelInventory extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'hotel_id',
        'room_type_id',
        'rate_id',
        'date',
        'total_rooms',
        'available_rooms',
        'sold_rooms',
        'blocked_rooms',
        'base_price',
        'sell_price',
        'currency',
        'tax_amount',
        'fee_amount',
        'is_closed',
        'restrictions',
    ];

    protected $casts = [
        'date' => 'date',
        'base_price' => 'decimal:4',
        'sell_price' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'fee_amount' => 'decimal:4',
        'is_closed' => 'boolean',
        'restrictions' => 'array',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['date', 'available_rooms', 'sell_price', 'is_closed'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(HotelRoomType::class);
    }

    public function rate(): BelongsTo
    {
        return $this->belongsTo(HotelRate::class);
    }

    public function isAvailable(int $rooms = 1): bool
    {
        return !$this->is_closed && $this->available_rooms >= $rooms;
    }

    public function getFormattedPrice(): string
    {
        return \App\Services\CurrencyService::format($this->sell_price, $this->currency);
    }
}