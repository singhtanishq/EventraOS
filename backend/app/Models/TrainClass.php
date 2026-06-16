<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainClass extends Model
{
    protected $fillable = ['train_route_id','provider_id','provider_class_id','name','code','capacity','amenities','has_berth','is_ac','is_active'];

    protected $casts = ['amenities' => ''array','has_berth' => ''boolean','is_ac' => ''boolean','is_active' => 'boolean];
}
