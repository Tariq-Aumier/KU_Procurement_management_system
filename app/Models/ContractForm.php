<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractForm extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'form_number',
        'form_date',
        'customer_name',
        'company_id',
        'office_id',
        'description',
        'grand_total',
        'status',
        'created_by',
        'updated_by',
        'submitted_at',
    ];

    protected $casts = [
        'form_date' => 'date',
        'grand_total' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(ContractFormItem::class, 'contract_form_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function auditLogs()
    {
        return $this->hasMany(ProcurementAuditLog::class, 'document_id')->where('document_type', 'contract_form');
    }

    public function generateFormNumber()
    {
        $year = date('Y');
        $prefix = "CF-{$year}-";
        $lastNumber = static::where('form_number', 'like', "{$prefix}%")
            ->orderBy('form_number', 'desc')
            ->value('form_number');
        
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
        
        static::creating(function ($form) {
            if (empty($form->form_number)) {
                $form->form_number = $form->generateFormNumber();
            }
        });
        
        static::saving(function ($form) {
            $form->grand_total = $form->items()->sum('line_total');
        });
    }
}
