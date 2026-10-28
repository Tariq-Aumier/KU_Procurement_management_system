<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class M3HForm extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'm3h_forms';

    protected $fillable = [
        'order_number',
        'issue_date',
        'purchasing_ministry',
        'purchase_request_number',
        'contract_id_number',
        'org_code',
        'project_code',
        'program_code',
        'fund_code',
        'type_code',
        'classification_code',
        'reason_code',
        'item_type_code',
        'delivery_date',
        'delivery_place',
        'total_price',
        'payment_deferred',
        'payment_installments',
        'payment_immediate',
        'receipt_report_date',
        'receipt_report_number',
        'procurement_dept_signature',
        'procurement_dept_date',
        'registry_dept_signature',
        'registry_dept_date',
        'authorized_officer_signature',
        'authorized_officer_date',
        'contractor_signature',
        'contractor_date',
        'financial_controller_signature',
        'financial_controller_date',
        'remarks',
        'status',
        'created_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'delivery_date' => 'date',
        'receipt_report_date' => 'date',
        'procurement_dept_date' => 'date',
        'registry_dept_date' => 'date',
        'authorized_officer_date' => 'date',
        'contractor_date' => 'date',
        'financial_controller_date' => 'date',
        'total_price' => 'decimal:2',
        'payment_deferred' => 'boolean',
        'payment_immediate' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(M3HItem::class, 'm3h_form_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
