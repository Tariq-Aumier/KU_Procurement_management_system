<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class M2RequestRow extends Model
{
    use HasFactory;

    protected $fillable = [
        'm2_form_id',
        'line_no',
        'description',
        'unit',
        'quantity',
        'unit_price',
        'estimated_amount',
        'notes',
        'requesting_branch',
        'supplier',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'estimated_amount' => 'decimal:2',
    ];

    public function m2Form()
    {
        return $this->belongsTo(M2Form::class);
    }
}
