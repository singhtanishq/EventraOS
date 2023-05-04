<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    protected $table = 'notification_preferences';

    protected $fillable = ['notifiable_type', 'notifiable_id', 'channels', 'types', 'quiet_hours'];
    protected $casts = ['channels' => 'array', 'types' => 'array', 'quiet_hours' => 'array'];

    public function notifiable()
    {
        return $this->morphTo();
    }
}
