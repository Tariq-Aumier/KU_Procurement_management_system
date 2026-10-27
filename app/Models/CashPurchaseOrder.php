<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashPurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'serial_number',
        'issue_date',
        'requested_by_department_id',
        'requested_by_person_id',
        'approving_officer_id',
        'private_number',
        'allocation_number',
        'accounting_department_id',
        'committed_amount',
        'payment_order_amount',
        'total_amount_words',
        'certifier_id',
        'control_dept_id',
        'final_control_id',
        'requisition_id',
        'status',
        'remarks',
        'fiscal_year',
        'created_by',
        'submitted_at',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'committed_amount' => 'decimal:2',
        'payment_order_amount' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(CashPoItem::class, 'cash_po_id');
    }

    public function requestedByDepartment()
    {
        return $this->belongsTo(Department::class, 'requested_by_department_id');
    }

    public function accountingDepartment()
    {
        return $this->belongsTo(Department::class, 'accounting_department_id');
    }

    public function requestedByPerson()
    {
        return $this->belongsTo(User::class, 'requested_by_person_id');
    }

    public function approvingOfficer()
    {
        return $this->belongsTo(User::class, 'approving_officer_id');
    }

    public function certifier()
    {
        return $this->belongsTo(User::class, 'certifier_id');
    }

    public function controlDept()
    {
        return $this->belongsTo(User::class, 'control_dept_id');
    }

    public function finalControl()
    {
        return $this->belongsTo(User::class, 'final_control_id');
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
        return $this->hasMany(ApprovalStep::class, 'document_id')->where('document_type', 'cash_po');
    }

    public function auditLogs()
    {
        return $this->hasMany(ProcurementAuditLog::class, 'document_id')->where('document_type', 'cash_po');
    }

    public function getGrandTotalAttribute()
    {
        return $this->items()->sum('estimated_price');
    }

    public function generateSerialNumber()
    {
        $year = $this->fiscal_year ?? '1405';
        $prefix = "CPO-{$year}-";
        $lastNumber = static::where('serial_number', 'like', "{$prefix}%")
            ->orderBy('serial_number', 'desc')
            ->value('serial_number');
        
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
        
        static::creating(function ($po) {
            if (empty($po->serial_number)) {
                $po->serial_number = $po->generateSerialNumber();
            }
        });
    }
}
