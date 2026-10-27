<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'evaluation_form_id',
        'line_no',
        'name',
        'specification',
        'unit',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
    ];

    public function evaluationForm()
    {
        return $this->belongsTo(EvaluationForm::class);
    }

    public function bidderPrices()
    {
        return $this->hasMany(EvaluationBidderPrice::class);
    }
}
