<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComparisonBidder extends Model
{
    use HasFactory;

    protected $fillable = [
        'comparison_sheet_id',
        'name',
        'address',
        'is_winner',
        'grand_total',
        'rank',
        'remarks',
    ];

    protected $casts = [
        'grand_total' => 'decimal:2',
        'is_winner' => 'boolean',
    ];

    public function comparisonSheet()
    {
        return $this->belongsTo(ComparisonSheet::class);
    }

    public function prices()
    {
        return $this->hasMany(ComparisonBidderPrice::class);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($bidder) {
            // Recalculate grand total from prices
            $bidder->grand_total = $bidder->prices()->sum('line_total');
        });

        static::saved(function ($bidder) {
            // Recalculate rankings when a bidder is saved
            $bidder->comparisonSheet->calculateRankings();
        });
    }
}
