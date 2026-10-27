<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BidEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'bid_id',
        'committee_member_id',
        'score',
        'recommendation',
        'comments',
        'signature',
        'signed_at',
        'status',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'signed_at' => 'datetime',
    ];

    public function bid()
    {
        return $this->belongsTo(Bid::class);
    }

    public function committeeMember()
    {
        return $this->belongsTo(CommitteeMember::class);
    }

    public function isDraft()
    {
        return $this->status === 'draft';
    }

    public function isSubmitted()
    {
        return $this->status === 'submitted';
    }

    public function submit()
    {
        $this->update([
            'status' => 'submitted',
            'signed_at' => now(),
        ]);
    }
}
