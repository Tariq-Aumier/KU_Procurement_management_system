<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class M2Form extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sequence_number',
        'date',
        'requesting_department',
        'approval_department',
        'fund_source',
        'budget_code',
        'total_amount',
        'status',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function requestRows()
    {
        return $this->hasMany(M2RequestRow::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
