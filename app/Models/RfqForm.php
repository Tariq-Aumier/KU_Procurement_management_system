<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfqForm extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'number',
        'issue_date',
        'deadline',
        'to_company',
        'requesting_department',
        'submission_office',
        'purpose',
        'total_amount',
        'status',
        'created_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'deadline' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(RfqFormItem::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
