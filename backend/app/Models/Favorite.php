<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    protected $fillable = ['customer_id', 'favoritable_type', 'favoritable_id', 'metadata'];

    protected $casts = ['metadata' => 'array'];

    public function favoritable()
    {
        return $this->morphTo();
    }
}
