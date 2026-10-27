<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommitteeMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'evaluation_committee_id',
        'user_id',
        'member_name',
        'position_title',
        'role',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function evaluationCommittee()
    {
        return $this->belongsTo(EvaluationCommittee::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isChair()
    {
        return $this->role === 'chair';
    }

    public function isMember()
    {
        return $this->role === 'member';
    }

    public function isSecretary()
    {
        return $this->role === 'secretary';
    }

    public function activate()
    {
        $this->update(['active' => true]);
    }

    public function deactivate()
    {
        $this->update(['active' => false]);
    }
}
