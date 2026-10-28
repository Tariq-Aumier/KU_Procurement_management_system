<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class M2Form extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'serial_number',
        'date',
        'requester_person',
        'requester_branch',
        'request_number',
        'total_amount',
        'amount_in_words',
        'purchase_from',
        'purchase_committee_location',
        'purchase_committee_date',
        'approval_officer',
        'calculation_branch',
        'allocation_number',
        'private_number',
        'commitment_amount',
        'payment_order',
        'description',
        'm16_certifier',
        'm12_certifier',
        'status',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'purchase_committee_date' => 'date',
        'total_amount' => 'decimal:2',
        'commitment_amount' => 'decimal:2',
    ];

    public function requestRows()
    {
        return $this->hasMany(M2RequestRow::class, 'm2_form_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
