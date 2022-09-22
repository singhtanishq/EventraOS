<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainRoute extends Model
{
    protected $fillable = ['uuid','provider_id','operator_id','train_number','train_name','origin_station_id','destination_station_id','intermediate_stations','departure_time','arrival_time','duration_minutes','running_days','train_type','is_active','is_demo','metadata'];

    protected $casts = ['intermediate_stations' => ''array','running_days' => ''array','is_active' => ''boolean','is_demo' => ''boolean','metadata' => 'array];
}
