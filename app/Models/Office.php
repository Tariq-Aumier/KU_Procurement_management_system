<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Office extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'office_category_id',
        'code',
        'name',
        'name_ps',
        'name_fa',
        'description',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function officeCategory()
    {
        return $this->belongsTo(OfficeCategory::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function users()
    {
        return $this->hasMany(User::class, 'office_id');
    }

    public function procurementOrders()
    {
        return $this->hasMany(ProcurementOrder::class);
    }

    public function inventoryLocations()
    {
        return $this->hasMany(InventoryLocation::class);
    }

    public function activate()
    {
        $this->update(['active' => true]);
    }

    public function deactivate()
    {
        $this->update(['active' => false]);
    }
}
