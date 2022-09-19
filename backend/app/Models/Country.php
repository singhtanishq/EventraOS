<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $fillable = [
        'name', 'iso_code_2', 'iso_code_3', 'iso_numeric', 'phone_code',
        'currency_code', 'currency_symbol', 'currency_name', 'capital',
        'region', 'subregion', 'languages', 'timezones', 'flag_emoji',
        'flag_url', 'is_active', 'sort_order',
    ];

    protected $casts = ['languages' => 'array', 'timezones' => 'array', 'is_active' => 'boolean'];

    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }
}
