<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RfqItemNew extends Model
{
    use HasFactory;

    protected $table = 'rfq_items';

    protected $fillable = [
        'rfq_form_id',
        'line_no',
        'item_name',
        'technical_description',
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

    public function rfqForm()
    {
        return $this->belongsTo(RfqFormNew::class, 'rfq_form_id');
    }

    public function unit()
    {
        return $this->belongsTo(UnitOfMeasure::class, 'unit_id');
    }

    public function bidderPrices()
    {
        return $this->hasMany(RfqBidderPrice::class, 'rfq_item_id');
    }

    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($item) {
            if ($item->unit_price && $item->quantity) {
                $item->line_total = $item->quantity * $item->unit_price;
            }
        });
    }
}
