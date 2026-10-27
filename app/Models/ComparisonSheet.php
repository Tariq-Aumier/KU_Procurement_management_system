<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ComparisonSheet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'rfq_document_number',
        'rfq_date',
        'implementing_agency',
        'requesting_department_id',
        'funding_source',
        'funder',
        'budget_code_id',
        'estimated_price',
        'award_recommendation',
        'certifier_id',
        'approver1_id',
        'approver2_id',
        'requisition_id',
        'status',
        'remarks',
        'fiscal_year',
        'created_by',
        'submitted_at',
    ];

    protected $casts = [
        'rfq_date' => 'date',
        'estimated_price' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(ComparisonItem::class);
    }

    public function bidders()
    {
        return $this->hasMany(ComparisonBidder::class);
    }

    public function committeeMembers()
    {
        return $this->hasMany(ComparisonCommitteeMember::class);
    }

    public function requestingDepartment()
    {
        return $this->belongsTo(Department::class, 'requesting_department_id');
    }

    public function budgetCode()
    {
        return $this->belongsTo(BudgetCode::class);
    }

    public function certifier()
    {
        return $this->belongsTo(User::class, 'certifier_id');
    }

    public function approver1()
    {
        return $this->belongsTo(User::class, 'approver1_id');
    }

    public function approver2()
    {
        return $this->belongsTo(User::class, 'approver2_id');
    }

    public function requisition()
    {
        return $this->belongsTo(Requisition::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvalSteps()
    {
        return $this->hasMany(ApprovalStep::class, 'document_id')->where('document_type', 'comparison');
    }

    public function auditLogs()
    {
        return $this->hasMany(ProcurementAuditLog::class, 'document_id')->where('document_type', 'comparison');
    }

    public function getWinnerAttribute()
    {
        return $this->bidders()->where('is_winner', true)->first();
    }

    public function calculateRankings()
    {
        $bidders = $this->bidders()->orderBy('grand_total', 'asc')->get();
        foreach ($bidders as $index => $bidder) {
            $bidder->rank = $index + 1;
            $bidder->save();
        }
    }
}
