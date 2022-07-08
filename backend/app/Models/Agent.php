<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Agent extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'agent_number',
        'employee_id',
        'agency_name',
        'agency_license',
        'address',
        'pan_number',
        'gstin',
        'bank_details',
        'commission_rate',
        'commission_type',
        'commission_rules',
        'monthly_target',
        'monthly_booking_target',
        'monthly_revenue_target',
        'status',
        'joined_at',
        'last_active_at',
        'manager_id',
        'permissions',
        'metadata',
    ];

    protected $casts = [
        'address' => 'array',
        'bank_details' => 'array',
        'commission_rate' => 'decimal:2',
        'commission_rules' => 'array',
        'monthly_target' => 'decimal:2',
        'monthly_booking_target' => 'decimal:2',
        'monthly_revenue_target' => 'decimal:2',
        'joined_at' => 'datetime',
        'last_active_at' => 'datetime',
        'permissions' => 'array',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($agent) {
            if (empty($agent->uuid)) {
                $agent->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($agent->agent_number)) {
                $agent->agent_number = 'AGT-' . strtoupper(\Illuminate\Support\Str::random(8));
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['agent_number', 'agency_name', 'commission_rate', 'status', 'monthly_target'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'manager_id');
    }

    public function subAgents(): HasMany
    {
        return $this->hasMany(Agent::class, 'manager_id');
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class, 'assigned_agent_id');
    }

    public function agentCustomers(): HasMany
    {
        return $this->hasMany(AgentCustomer::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function targets(): HasMany
    {
        return $this->hasMany(AgentTarget::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(AgentTask::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'assigned_agent_id');
    }

    public function getFullNameAttribute(): string
    {
        return $this->user->name ?? '';
    }

    public function getEmailAttribute(): string
    {
        return $this->user->email ?? '';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function getCommissionRateForService(string $serviceType): float
    {
        if ($this->commission_rules && isset($this->commission_rules[$serviceType])) {
            return (float) $this->commission_rules[$serviceType];
        }
        return (float) $this->commission_rate;
    }
}