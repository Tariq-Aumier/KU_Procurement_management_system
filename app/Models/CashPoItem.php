<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashPoItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'cash_po_id',
        'line_no',
        'description',
        'unit_id',
        'quantity',
        'unit_price',
        'estimated_price',
        'paid_price',
        'purchased_from',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'estimated_price' => 'decimal:2',
        'paid_price' => 'decimal:2',
    ];

    public function cashPo()
    {
        return $this->belongsTo(CashPurchaseOrder::class, 'cash_po_id');
    }

    public function unit()
    {
        return $this->belongsTo(UnitOfMeasure::class, 'unit_id');
    }

    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($item) {
            if ($item->unit_price && $item->quantity) {
                $item->estimated_price = $item->quantity * $item->unit_price;
            }
        });
    }
}
