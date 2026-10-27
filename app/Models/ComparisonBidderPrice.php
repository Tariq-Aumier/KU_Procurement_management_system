<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComparisonBidderPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'comparison_bidder_id',
        'comparison_item_id',
        'unit_price',
        'line_total',
        'remarks',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function bidder()
    {
        return $this->belongsTo(ComparisonBidder::class, 'comparison_bidder_id');
    }

    public function item()
    {
        return $this->belongsTo(ComparisonItem::class, 'comparison_item_id');
    }

    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($price) {
            if ($price->unit_price) {
                $item = $price->item;
                if ($item) {
                    $price->line_total = $item->quantity * $price->unit_price;
                }
            }
        });
    }
}
