<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackageItem extends Model
{
    protected $table = 'package_items';

    protected $fillable = ['package_id', 'day_number', 'service_type', 'service_id', 'service_name', 'service_details', 'start_time', 'end_time', 'location', 'notes', 'sort_order'];
    protected $casts = ['service_details' => 'array'];

    public function package(): BelongsTo { return $this->belongsTo(TravelPackage::class, 'package_id'); }
}
