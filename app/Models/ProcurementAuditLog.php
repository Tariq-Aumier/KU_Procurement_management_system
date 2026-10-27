<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProcurementAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_type',
        'document_id',
        'user_id',
        'action',
        'old_values',
        'new_values',
        'remarks',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForDocument($query, $documentType, $documentId)
    {
        return $query->where('document_type', $documentType)->where('document_id', $documentId);
    }
}
