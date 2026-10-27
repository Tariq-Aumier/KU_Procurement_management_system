<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvaluationForm extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference_number',
        'title',
        'date',
        'total_amount',
        'status',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(EvaluationItem::class);
    }

    public function bidders()
    {
        return $this->hasMany(EvaluationBidder::class);
    }

    public function committeeMembers()
    {
        return $this->hasMany(EvaluationCommitteeMember::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
