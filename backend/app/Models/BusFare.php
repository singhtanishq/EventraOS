<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusFare extends Model
{
    protected $fillable = ['bus_route_id','bus_type_id','provider_id','provider_fare_id','base_fare','tax_amount','fee_amount','currency','cancellation_policy','is_active'];

    protected $casts = ['base_fare' => ''decimal' => ''4','tax_amount' => ''decimal' => ''4','fee_amount' => ''decimal' => ''4','cancellation_policy' => ''array','is_active' => 'boolean];
}
