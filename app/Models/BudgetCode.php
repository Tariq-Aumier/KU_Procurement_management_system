<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BudgetCode extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organ_code',
        'project_code',
        'program_code',
        'fund_code',
        'type_code',
        'classification_code',
        'description',
        'allocated_amount',
        'committed_amount',
        'fiscal_year',
    ];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'committed_amount' => 'decimal:2',
    ];

    public function getAvailableAmountAttribute()
    {
        return $this->allocated_amount - $this->committed_amount;
    }

    public function requisitions()
    {
        return $this->hasMany(Requisition::class);
    }
}
