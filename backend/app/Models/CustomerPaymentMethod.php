<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerPaymentMethod extends Model
{
    protected $table = 'customer_payment_methods';

    protected $fillable = [
        'customer_id', 'payment_method_id', 'gateway_token', 'gateway_customer_id',
        'display_name', 'details', 'is_default', 'is_active', 'verified_at',
    ];

    protected $casts = ['details' => 'array', 'is_default' => 'boolean', 'is_active' => 'boolean', 'verified_at' => 'datetime'];

    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
}
