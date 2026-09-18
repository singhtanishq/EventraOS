<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferVehicleType extends Model
{
    protected $table = 'transfer_vehicle_types';

    protected $fillable = ['name', 'code', 'max_passengers', 'max_luggage', 'features', 'has_driver', 'sort_order', 'is_active'];
    protected $casts = ['features' => 'array', 'has_driver' => 'boolean', 'is_active' => 'boolean'];
}
