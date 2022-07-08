<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class HotelRate extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'hotel_id',
        'room_type_id',
        'provider_id',
        'provider_rate_id',
        'name',
        'code',
        'meal_plan',
        'cancellation_policy',
        'cancellation_policy_text',
        'conditions',
        'is_refundable',
        'is_prepaid',
        'requires_guarantee',
        'is_active',
    ];

    protected $casts = [
        'cancellation_policy' => 'array',
        'conditions' => 'array',
        'is_refundable' => 'boolean',
        'is_prepaid' => 'boolean',
        'requires_guarantee' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'meal_plan', 'is_refundable', 'is_active'])
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

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(HotelInventory::class);
    }

    public function getCancellationDescription(): string
    {
        return $this->cancellation_policy_text ?? 'Standard cancellation policy applies';
    }

    public function isFreeCancellation(): bool
    {
        return $this->cancellation_policy['free_cancellation'] ?? false;
    }

    public function getCancellationDeadline(\Carbon\Carbon $checkIn): ?\Carbon\Carbon
    {
        if (!$this->cancellation_policy) return null;
        
        $hours = $this->cancellation_policy['free_cancellation_hours'] ?? 
                 $this->cancellation_policy['cancellation_deadline_hours'] ?? 48;
        
        return $checkIn->copy()->subHours($hours);
    }
}