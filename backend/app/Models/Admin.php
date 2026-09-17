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

class Admin extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'admin_number',
        'employee_id',
        'department',
        'level',
        'permissions',
        'can_manage_admins',
        'can_manage_agents',
        'can_manage_finances',
        'can_view_audit_logs',
        'can_manage_system',
        'last_active_at',
        'metadata',
    ];

    protected $casts = [
        'permissions' => 'array',
        'can_manage_admins' => 'boolean',
        'can_manage_agents' => 'boolean',
        'can_manage_finances' => 'boolean',
        'can_view_audit_logs' => 'boolean',
        'can_manage_system' => 'boolean',
        'last_active_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($admin) {
            if (empty($admin->uuid)) {
                $admin->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($admin->admin_number)) {
                $admin->admin_number = 'ADM-' . strtoupper(\Illuminate\Support\Str::random(8));
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['admin_number', 'department', 'level', 'can_manage_admins', 'can_manage_finances'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFullNameAttribute(): string
    {
        return $this->user->name ?? '';
    }

    public function getEmailAttribute(): string
    {
        return $this->user->email ?? '';
    }

    public function isSuperAdmin(): bool
    {
        return $this->level === 'super_admin';
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) return true;
        
        if ($this->permissions && in_array($permission, $this->permissions)) {
            return true;
        }

        // Check level-based permissions
        $levelPermissions = [
            'admin' => ['*'],
            'manager' => ['bookings.*', 'customers.*', 'agents.view', 'reports.*'],
            'support' => ['bookings.view', 'customers.view', 'support.*'],
            'finance' => ['payments.*', 'refunds.*', 'commissions.*', 'invoices.*', 'reports.financial'],
            'operations' => ['bookings.*', 'suppliers.*', 'venues.*', 'providers.*'],
        ];

        $permissions = $levelPermissions[$this->level] ?? [];
        
        if (in_array('*', $permissions)) return true;
        
        foreach ($permissions as $perm) {
            if ($perm === $permission || (str_ends_with($perm, '.*') && str_starts_with($permission, str_replace('.*', '', $perm)))) {
                return true;
            }
        }

        return false;
    }
}