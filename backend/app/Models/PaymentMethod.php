<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentMethod extends Model
{
    protected $fillable = [
        'name', 'code', 'type', 'icon', 'gateway', 'supported_currencies',
        'supported_countries', 'fee_percentage', 'fee_fixed', 'requires_redirect',
        'supports_refund', 'supports_partial_refund', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'supported_currencies' => 'array', 'supported_countries' => 'array',
        'fee_percentage' => 'decimal:2', 'fee_fixed' => 'decimal:4',
        'requires_redirect' => 'boolean', 'supports_refund' => 'boolean',
        'supports_partial_refund' => 'boolean', 'is_active' => 'boolean',
    ];

    public function payments(): HasMany { return $this->hasMany(Payment::class); }
}
