<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentCustomer extends Model
{
    protected $table = 'agent_customers';

    protected $fillable = ['agent_id', 'customer_id', 'relationship_type', 'assigned_at', 'assigned_by', 'is_active'];
    protected $casts = ['assigned_at' => 'datetime', 'is_active' => 'boolean'];

    public function agent(): BelongsTo { return $this->belongsTo(Agent::class); }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
}
