<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Provider extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type',
        'mode',
        'base_url',
        'credentials',
        'configuration',
        'status',
        'priority',
        'supported_countries',
        'supported_currencies',
        'capabilities',
        'last_sync_at',
        'last_error_at',
        'last_error_message',
        'error_count',
        'success_count',
        'avg_latency_ms',
        'is_default',
    ];

    protected $casts = [
        'credentials' => 'encrypted:array',
        'configuration' => 'array',
        'supported_countries' => 'array',
        'supported_currencies' => 'array',
        'capabilities' => 'array',
        'last_sync_at' => 'datetime',
        'last_error_at' => 'datetime',
        'is_default' => 'boolean',
    ];

    public static array $types = [
        'hotel', 'flight', 'train', 'bus', 'venue', 'car', 'activity', 'transfer', 'payment'
    ];

    public static array $modes = ['demo', 'live'];
    public static array $statuses = ['active', 'inactive', 'maintenance', 'error'];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'code', 'type', 'mode', 'status', 'priority', 'is_default'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function hotels(): HasMany
    {
        return $this->hasMany(Hotel::class);
    }

    public function flights(): HasMany
    {
        return $this->hasMany(Flight::class);
    }

    public function trainRoutes(): HasMany
    {
        return $this->hasMany(TrainRoute::class);
    }

    public function busRoutes(): HasMany
    {
        return $this->hasMany(BusRoute::class);
    }

    public function venues(): HasMany
    {
        return $this->hasMany(Venue::class);
    }

    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(Transfer::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ProviderLog::class);
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(ProviderCredential::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isDemo(): bool
    {
        return $this->mode === 'demo';
    }

    public function isLive(): bool
    {
        return $this->mode === 'live';
    }

    public function supportsCountry(string $countryCode): bool
    {
        if (!$this->supported_countries) return true;
        return in_array(strtoupper($countryCode), $this->supported_countries);
    }

    public function supportsCurrency(string $currencyCode): bool
    {
        if (!$this->supported_currencies) return true;
        return in_array(strtoupper($currencyCode), $this->supported_currencies);
    }

    public function recordSuccess(int $durationMs): void
    {
        $this->increment('success_count');
        $this->update([
            'last_sync_at' => now(),
            'avg_latency_ms' => ($this->avg_latency_ms * ($this->success_count - 1) + $durationMs) / $this->success_count,
            'last_error_message' => null,
        ]);
    }

    public function recordError(string $message, int $durationMs = 0): void
    {
        $this->increment('error_count');
        $this->update([
            'last_error_at' => now(),
            'last_error_message' => $message,
            'status' => $this->error_count > 5 ? 'error' : $this->status,
        ]);
    }
}