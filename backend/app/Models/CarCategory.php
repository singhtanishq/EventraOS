<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarCategory extends Model
{
    protected $fillable = ['name', 'code', 'description', 'seats', 'doors', 'bags', 'is_ac', 'transmission', 'fuel_type', 'sort_order', 'is_active'];
    protected $casts = ['is_ac' => 'boolean', 'is_active' => 'boolean'];
}
