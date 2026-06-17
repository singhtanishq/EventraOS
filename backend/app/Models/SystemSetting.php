<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = ['key', 'group', 'value', 'type', 'description', 'is_public', 'is_encrypted', 'validation_rules', 'options', 'sort_order'];
    protected $casts = ['is_public' => 'boolean', 'is_encrypted' => 'boolean', 'validation_rules' => 'array', 'options' => 'array'];
}
