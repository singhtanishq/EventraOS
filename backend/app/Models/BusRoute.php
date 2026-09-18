<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusRoute extends Model
{
    protected $fillable = ['uuid','provider_id','operator_id','origin_terminal_id','destination_terminal_id','route_name','departure_time','arrival_time','duration_minutes','boarding_points','dropping_points','running_days','is_active','is_demo','metadata'];

    protected $casts = ['boarding_points' => ''array','dropping_points' => ''array','running_days' => ''array','is_active' => ''boolean','is_demo' => ''boolean','metadata' => 'array];
}
