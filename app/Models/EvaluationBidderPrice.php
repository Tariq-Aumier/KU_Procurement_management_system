<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationBidderPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'evaluation_bidder_id',
        'evaluation_item_id',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function bidder()
    {
        return $this->belongsTo(EvaluationBidder::class);
    }

    public function item()
    {
        return $this->belongsTo(EvaluationItem::class);
    }
}
