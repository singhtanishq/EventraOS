<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrainFare extends Model
{
    protected $table = 'train_fares';

    protected $fillable = ['train_route_id', 'class_id', 'provider_id', 'provider_fare_id', 'quota', 'base_fare', 'tax_amount', 'fee_amount', 'currency', 'fare_rules', 'is_active'];
    protected $casts = ['base_fare' => 'decimal:4', 'tax_amount' => 'decimal:4', 'fee_amount' => 'decimal:4', 'fare_rules' => 'array', 'is_active' => 'boolean'];

    public function trainRoute(): BelongsTo { return $this->belongsTo(TrainRoute::class); }
    public function trainClass(): BelongsTo { return $this->belongsTo(TrainClass::class, 'class_id'); }
}
