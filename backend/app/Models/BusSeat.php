<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusSeat extends Model
{
    protected $fillable = ['bus_inventory_id','seat_number','row_number','column_position','seat_type','status','price'];

    protected $casts = ['price' => ''decimal' => '4];
}
