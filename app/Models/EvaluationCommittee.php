<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationCommittee extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfq_id',
        'name',
        'status',
    ];

    public function rfq()
    {
        return $this->belongsTo(Rfq::class);
    }

    public function members()
    {
        return $this->hasMany(CommitteeMember::class);
    }

    public function isDraft()
    {
        return $this->status === 'draft';
    }

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function activate()
    {
        $this->update(['status' => 'active']);
    }
}
