<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderLog extends Model
{
    protected $table = 'provider_logs';

    protected $fillable = ['provider_id', 'endpoint', 'method', 'request', 'response', 'status_code', 'duration_ms', 'correlation_id', 'result', 'error_message'];
    protected $casts = ['request' => 'array', 'response' => 'array'];

    public function provider(): BelongsTo { return $this->belongsTo(Provider::class); }
}
