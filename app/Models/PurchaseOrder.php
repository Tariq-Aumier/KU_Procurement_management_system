<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'po_number',
        'contract_type',
        'ministry_organ',
        'issue_date',
        'requisition_id',
        'contractor_id_number',
        'budget_code_id',
        'delivery_date',
        'delivery_location',
        'grand_total',
        'payment_type',
        'installment_details',
        'receipt_report_date',
        'receipt_report_number',
        'financial_controller_id',
        'remarks',
        'item_description',
        'rate_per_unit',
        'total_rent_value',
        'total_rent_sum',
        'profit_determination',
        'profit_accessibility_confirmed',
        'lease_conditions_present',
        'counterparty_signature_required',
        'status',
        'fiscal_year',
        'created_by',
        'submitted_at',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'delivery_date' => 'date',
        'receipt_report_date' => 'date',
        'grand_total' => 'decimal:2',
        'rate_per_unit' => 'decimal:2',
        'total_rent_value' => 'decimal:2',
        'total_rent_sum' => 'decimal:2',
        'profit_accessibility_confirmed' => 'boolean',
        'lease_conditions_present' => 'boolean',
        'counterparty_signature_required' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function approvals()
    {
        return $this->hasMany(PurchaseOrderApproval::class);
    }

    public function budgetCode()
    {
        return $this->belongsTo(BudgetCode::class);
    }

    public function financialController()
    {
        return $this->belongsTo(User::class, 'financial_controller_id');
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
        return $this->hasMany(ApprovalStep::class, 'document_id')->where('document_type', 'purchase_order');
    }

    public function auditLogs()
    {
        return $this->hasMany(ProcurementAuditLog::class, 'document_id')->where('document_type', 'purchase_order');
    }

    public function isAbsoluteSale()
    {
        return $this->contract_type === 'absolute_sale';
    }

    public function isLease()
    {
        return $this->contract_type === 'lease';
    }

    public function generatePoNumber()
    {
        $year = $this->fiscal_year ?? '1405';
        $typePrefix = $this->contract_type === 'lease' ? 'M3D' : 'M3H';
        $prefix = "{$typePrefix}-{$year}-";
        $lastNumber = static::where('po_number', 'like', "{$prefix}%")
            ->where('contract_type', $this->contract_type)
            ->orderBy('po_number', 'desc')
            ->value('po_number');
        
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
            if (empty($po->po_number)) {
                $po->po_number = $po->generatePoNumber();
            }
        });
    }
}
