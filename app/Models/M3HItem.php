<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class M3HItem extends Model
{
    use HasFactory;

    protected $table = 'm3h_items';

    protected $fillable = [
        'm3h_form_id',
        'line_no',
        'description',
        'type_code',
        'classification_code',
        'quantity',
        'unit',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function m3hForm()
    {
        return $this->belongsTo(M3HForm::class, 'm3h_form_id');
    }
}
