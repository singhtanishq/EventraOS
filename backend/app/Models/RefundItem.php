<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundItem extends Model
{
    protected $table = 'refund_items';

    protected $fillable = ['refund_id', 'booking_item_id', 'amount', 'currency'];

    protected $casts = ['amount' => 'decimal:4'];

    public function refund(): BelongsTo
    {
        return $this->belongsTo(Refund::class);
    }
}
