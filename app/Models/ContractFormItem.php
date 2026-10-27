<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContractFormItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_form_id',
        'line_no',
        'item_name',
        'specifications',
        'unit_id',
        'quantity',
        'unit_price',
        'line_total',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function contractForm()
    {
        return $this->belongsTo(ContractForm::class, 'contract_form_id');
    }

    public function unit()
    {
        return $this->belongsTo(UnitOfMeasure::class, 'unit_id');
    }

    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($item) {
            // Auto-calculate line total: quantity * unit_price
            $item->line_total = $item->quantity * $item->unit_price;
        });
    }
}
