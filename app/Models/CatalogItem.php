<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatalogItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'name_en',
        'name_ps',
        'name_fa',
        'description',
        'unit_id',
        'category',
        'default_unit_price',
        'active',
    ];

    protected $casts = [
        'default_unit_price' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function unit()
    {
        return $this->belongsTo(UnitOfMeasure::class, 'unit_id');
    }
}
