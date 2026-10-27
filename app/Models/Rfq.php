<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rfq extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'rfq_no',
        'procurement_order_id',
        'issue_date',
        'closing_at',
        'validity_days',
        'quantity_adjust_percent',
        'domestic_preference',
        'domestic_preference_percent',
        'status',
        'issuing_officer_id',
        'officer_role',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'closing_at' => 'datetime',
        'quantity_adjust_percent' => 'decimal:2',
        'domestic_preference' => 'boolean',
        'domestic_preference_percent' => 'decimal:2',
    ];

    public function procurementOrder()
    {
        return $this->belongsTo(ProcurementOrder::class);
    }

    public function issuingOfficer()
    {
        return $this->belongsTo(User::class, 'issuing_officer_id');
    }

    public function items()
    {
        return $this->hasMany(RfqItem::class);
    }

    public function vendorInvitations()
    {
        return $this->hasMany(RfqVendorInvitation::class);
    }

    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    public function evaluationCommittee()
    {
        return $this->hasOne(EvaluationCommittee::class);
    }

    public function award()
    {
        return $this->hasOne(Award::class);
    }

    public function isDraft()
    {
        return $this->status === 'draft';
    }

    public function isPublished()
    {
        return $this->status === 'published';
    }

    public function isClosed()
    {
        return $this->status === 'closed';
    }

    public function publish()
    {
        $this->update(['status' => 'published']);
    }

    public function close()
    {
        $this->update(['status' => 'closed']);
    }
}
