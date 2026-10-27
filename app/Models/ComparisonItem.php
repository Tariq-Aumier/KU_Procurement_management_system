<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComparisonItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'comparison_sheet_id',
        'line_no',
        'item_name',
        'technical_description',
        'unit_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
    ];

    public function comparisonSheet()
    {
        return $this->belongsTo(ComparisonSheet::class);
    }

    public function unit()
    {
        return $this->belongsTo(UnitOfMeasure::class, 'unit_id');
    }

    public function bidderPrices()
    {
        return $this->hasMany(ComparisonBidderPrice::class, 'comparison_item_id');
    }
}
