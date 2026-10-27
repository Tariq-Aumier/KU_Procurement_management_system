<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfq_id',
        'vendor_id',
        'bid_no',
        'submitted_at',
        'total_price',
        'currency',
        'valid_until',
        'status',
        'rejection_reason',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'total_price' => 'decimal:2',
        'valid_until' => 'date',
    ];

    public function rfq()
    {
        return $this->belongsTo(Rfq::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function items()
    {
        return $this->hasMany(BidItem::class);
    }

    public function evaluations()
    {
        return $this->hasMany(BidEvaluation::class);
    }

    public function isSubmitted()
    {
        return $this->status === 'submitted';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function isAccepted()
    {
        return $this->status === 'accepted';
    }

    public function reject($reason = null)
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);
    }

    public function accept()
    {
        $this->update(['status' => 'accepted']);
    }
}
