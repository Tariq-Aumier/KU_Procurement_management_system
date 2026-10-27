<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_type',
        'document_id',
        'step_order',
        'required_role',
        'signer_id',
        'status',
        'remarks',
        'signed_at',
        'signature_image',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    public function signer()
    {
        return $this->belongsTo(User::class, 'signer_id');
    }

    public function scopeForDocument($query, $documentType, $documentId)
    {
        return $query->where('document_type', $documentType)->where('document_id', $documentId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}
