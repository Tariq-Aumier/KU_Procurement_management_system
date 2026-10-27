<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RfqItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfq_id',
        'line_no',
        'description',
        'unit',
        'quantity',
        'estimated_unit_price',
        'technical_specification',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'estimated_unit_price' => 'decimal:2',
    ];

    public function rfq()
    {
        return $this->belongsTo(Rfq::class);
    }

    public function bidItems()
    {
        return $this->hasMany(BidItem::class);
    }
}
