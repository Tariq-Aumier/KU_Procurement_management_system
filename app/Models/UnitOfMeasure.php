<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UnitOfMeasure extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'name_en',
        'name_ps',
        'name_fa',
        'abbreviation',
    ];

    public function catalogItems()
    {
        return $this->hasMany(CatalogItem::class, 'unit_id');
    }
}
