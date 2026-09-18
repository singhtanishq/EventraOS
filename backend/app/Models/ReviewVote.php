<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewVote extends Model
{
    protected $table = 'review_votes';

    protected $fillable = ['review_id', 'customer_id', 'vote'];

    public function review(): BelongsTo { return $this->belongsTo(Review::class); }
}
