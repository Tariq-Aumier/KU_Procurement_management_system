<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfqFormNew extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rfq_forms';

    protected $fillable = [
        'rfq_number',
        'issue_date',
        'addressed_to',
        'submission_deadline',
        'submission_location',
        'validity_period_days',
        'quantity_variance_pct',
        'local_preference_applicable',
        'local_preference_pct',
        'department_id',
        'issuing_officer_id',
        'requisition_id',
        'status',
        'subtotal_excl_tax',
        'tax_amount',
        'total_incl_tax',
        'total_incl_tax_words',
        'delivery_period_days',
        'warranty_period_days',
        'remarks',
        'fiscal_year',
        'created_by',
        'submitted_at',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'submission_deadline' => 'datetime',
        'submitted_at' => 'datetime',
        'quantity_variance_pct' => 'decimal:2',
        'local_preference_pct' => 'decimal:2',
        'subtotal_excl_tax' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_incl_tax' => 'decimal:2',
        'local_preference_applicable' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(RfqItemNew::class);
    }

    public function bidders()
    {
        return $this->hasMany(RfqBidder::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function issuingOfficer()
    {
        return $this->belongsTo(User::class, 'issuing_officer_id');
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
        return $this->hasMany(ApprovalStep::class, 'document_id')->where('document_type', 'rfq');
    }

    public function auditLogs()
    {
        return $this->hasMany(ProcurementAuditLog::class, 'document_id')->where('document_type', 'rfq');
    }

    public function generateRfqNumber()
    {
        $year = $this->fiscal_year ?? '1405';
        $prefix = "RFQ-{$year}-";
        $lastNumber = static::where('rfq_number', 'like', "{$prefix}%")
            ->orderBy('rfq_number', 'desc')
            ->value('rfq_number');
        
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
        
        static::creating(function ($rfq) {
            if (empty($rfq->rfq_number)) {
                $rfq->rfq_number = $rfq->generateRfqNumber();
            }
        });
    }
}
