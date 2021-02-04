<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class HotelRoomType extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'hotel_id',
        'provider_id',
        'provider_room_type_id',
        'uuid',
        'name',
        'slug',
        'description',
        'max_occupancy',
        'adult_capacity',
        'child_capacity',
        'infant_capacity',
        'bed_configuration',
        'amenities',
        'images',
        'quantity',
        'size_sqm',
        'view_type',
        'is_smoking',
        'is_accessible',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'bed_configuration' => 'array',
        'amenities' => 'array',
        'images' => 'array',
        'is_smoking' => 'boolean',
        'is_accessible' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($roomType) {
            if (empty($roomType->uuid)) {
                $roomType->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($roomType->slug)) {
                $roomType->slug = \Illuminate\Support\Str::slug($roomType->name) . '-' . \Illuminate\Support\Str::random(4);
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'max_occupancy', 'quantity', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function rates(): HasMany
    {
        return $this->hasMany(HotelRate::class)->where('is_active', true);
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(HotelInventory::class);
    }

    public function bookingItems(): HasMany
    {
        return $this->hasMany(BookingItem::class);
    }

    public function getBedDescription(): string
    {
        if (!$this->bed_configuration) return '';
        
        $descriptions = [];
        foreach ($this->bed_configuration as $bed) {
            $count = $bed['count'] ?? 1;
            $type = $bed['type'] ?? 'bed';
            $descriptions[] = ($count > 1 ? "{$count} " : '') . ucfirst(str_replace('_', ' ', $type));
        }
        return implode(', ', $descriptions);
    }
}