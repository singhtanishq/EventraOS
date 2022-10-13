<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecentlyViewed extends Model
{
    protected $fillable = ['customer_id', 'session_id', 'viewable_type', 'viewable_id', 'metadata'];
    protected $casts = ['metadata' => 'array'];

    public function viewable()
    {
        return $this->morphTo();
    }
}
