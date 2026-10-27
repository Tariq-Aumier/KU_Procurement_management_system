<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $table = 'order_items';

    protected $fillable = [
        'procurement_order_id',
        'line_no',
        'description',
        'unit',
        'quantity',
        'estimated_unit_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'estimated_unit_price' => 'decimal:2',
    ];

    public function procurementOrder()
    {
        return $this->belongsTo(ProcurementOrder::class);
    }

    public function getLineTotalAttribute()
    {
        return $this->quantity * ($this->estimated_unit_price ?? 0);
    }
}
