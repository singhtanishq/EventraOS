<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CancellationPolicy extends Model
{
    protected $table = 'cancellation_policies';

    protected $fillable = ['name', 'slug', 'service_type', 'rules', 'description', 'is_default', 'is_active', 'conditions'];
    protected $casts = ['rules' => 'array', 'is_default' => 'boolean', 'is_active' => 'boolean', 'conditions' => 'array'];
}
