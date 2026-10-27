<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationBidder extends Model
{
    use HasFactory;

    protected $fillable = [
        'evaluation_form_id',
        'name',
        'type',
        'total_price',
        'is_winner',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'is_winner' => 'boolean',
    ];

    public function evaluationForm()
    {
        return $this->belongsTo(EvaluationForm::class);
    }

    public function prices()
    {
        return $this->hasMany(EvaluationBidderPrice::class);
    }
}
