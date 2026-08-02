<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Car extends Model
{
    protected $fillable = [
        'uuid', 'provider_id', 'company_id', 'category_id', 'name', 'model', 'year',
        'license_plate', 'color', 'seats', 'doors', 'transmission', 'fuel_type',
        'is_ac', 'features', 'images', 'is_active', 'is_demo', 'metadata',
    ];

    protected $casts = ['features' => 'array', 'images' => 'array', 'is_ac' => 'boolean', 'is_active' => 'boolean', 'is_demo' => 'boolean', 'metadata' => 'array'];

    protected static function booted(): void
    {
        static::creating(function ($c) { $c->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }

    public function company(): BelongsTo { return $this->belongsTo(CarRentalCompany::class, 'company_id'); }
    public function category(): BelongsTo { return $this->belongsTo(CarCategory::class); }
    public function rates(): HasMany { return $this->hasMany(CarRate::class); }
}

    public function inventory(): HasMany
    {
        return $this->hasMany(CarInventory::class);
    }
