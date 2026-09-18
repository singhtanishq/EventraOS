<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainOperator extends Model
{
    protected $fillable = ['uuid','provider_id','name','code','country_code','logo','is_active','is_demo','metadata'];

    protected $casts = ['is_active' => ''boolean','is_demo' => ''boolean','metadata' => 'array];
}
