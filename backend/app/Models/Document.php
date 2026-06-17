<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'uuid', 'document_type', 'documentable_type', 'documentable_id',
        'file_name', 'file_path', 'mime_type', 'file_size', 'checksum',
        'is_verified', 'is_confidential', 'expires_at', 'uploaded_by', 'metadata',
    ];

    protected $casts = ['is_verified' => 'boolean', 'is_confidential' => 'boolean', 'expires_at' => 'datetime', 'metadata' => 'array'];

    protected static function booted(): void
    {
        static::creating(function ($d) { $d->uuid ??= (string) \Illuminate\Support\Str::uuid(); });
    }

    public function documentable()
    {
        return $this->morphTo();
    }
}
