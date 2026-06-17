<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $fillable = ['key', 'name', 'description', 'enabled', 'conditions', 'variants', 'is_permanent'];
    protected $casts = ['enabled' => 'boolean', 'conditions' => 'array', 'variants' => 'array', 'is_permanent' => 'boolean'];
}
