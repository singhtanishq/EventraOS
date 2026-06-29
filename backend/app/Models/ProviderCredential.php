<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProviderCredential extends Model
{
    protected $table = 'provider_credentials';

    protected $fillable = ['provider_id', 'environment', 'key_name', 'encrypted_value', 'description', 'is_active', 'expires_at'];
    protected $casts = ['encrypted_value' => 'encrypted', 'is_active' => 'boolean', 'expires_at' => 'datetime'];
}
