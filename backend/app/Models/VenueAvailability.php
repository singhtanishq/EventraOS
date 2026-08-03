<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenueAvailability extends Model
{
    protected $fillable = ['venue_id', 'venue_room_id', 'date', 'start_time', 'end_time', 'status', 'booking_id', 'event_details', 'price_override'];
    protected $casts = ['date' => 'date', 'event_details' => 'array', 'price_override' => 'decimal:4'];

    public function venue(): BelongsTo { return $this->belongsTo(Venue::class); }
    protected $table = 'venue_availability';
}
