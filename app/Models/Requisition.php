<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Requisition extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'request_number',
        'department_id',
        'requested_by',
        'title',
        'description',
        'budget_code_id',
        'estimated_amount',
        'status',
        'fiscal_year',
        'submitted_at',
        'completed_at',
    ];

    protected $casts = [
        'estimated_amount' => 'decimal:2',
        'submitted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function budgetCode()
    {
        return $this->belongsTo(BudgetCode::class);
    }

    public function approvalSteps()
    {
        return $this->hasMany(ApprovalStep::class, 'document_id')->where('document_type', 'requisition');
    }

    public function auditLogs()
    {
        return $this->hasMany(ProcurementAuditLog::class, 'document_id')->where('document_type', 'requisition');
    }

    public function generateRequestNumber()
    {
        $year = $this->fiscal_year ?? '1405';
        $prefix = "REQ-{$year}-";
        $lastNumber = static::where('request_number', 'like', "{$prefix}%")
            ->orderBy('request_number', 'desc')
            ->value('request_number');
        
        if ($lastNumber) {
            $lastSeq = (int) str_replace($prefix, '', $lastNumber);
            $newSeq = $lastSeq + 1;
        } else {
            $newSeq = 1;
        }
        
        return $prefix . str_pad($newSeq, 5, '0', STR_PAD_LEFT);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($requisition) {
            if (empty($requisition->request_number)) {
                $requisition->request_number = $requisition->generateRequestNumber();
            }
        });
    }
}
