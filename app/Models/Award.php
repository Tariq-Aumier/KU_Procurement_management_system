<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Award extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfq_id',
        'winning_bid_id',
        'award_no',
        'award_amount',
        'currency',
        'decision_reason',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'award_amount' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function rfq()
    {
        return $this->belongsTo(Rfq::class);
    }

    public function winningBid()
    {
        return $this->belongsTo(Bid::class, 'winning_bid_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function contract()
    {
        return $this->hasOne(Contract::class);
    }

    public function isRecommended()
    {
        return $this->status === 'recommended';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function approve($userId)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
    }
}
