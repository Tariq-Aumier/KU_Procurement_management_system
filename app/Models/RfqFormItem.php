<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RfqFormItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfq_form_id',
        'line_no',
        'name',
        'technical_spec',
        'unit',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
    ];

    public function rfqForm()
    {
        return $this->belongsTo(RfqForm::class);
    }
}
