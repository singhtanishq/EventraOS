<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $table = 'email_templates';

    protected $fillable = ['key', 'name', 'subject', 'html_content', 'text_content', 'variables', 'category', 'is_active', 'metadata'];
    protected $casts = ['variables' => 'array', 'is_active' => 'boolean', 'metadata' => 'array'];
}
