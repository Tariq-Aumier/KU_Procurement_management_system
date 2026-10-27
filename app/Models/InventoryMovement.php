<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_item_id',
        'movement_type',
        'quantity',
        'previous_quantity',
        'new_quantity',
        'from_location_id',
        'to_location_id',
        'reference_no',
        'notes',
        'performed_by',
        'movement_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'previous_quantity' => 'decimal:3',
        'new_quantity' => 'decimal:3',
        'movement_at' => 'datetime',
    ];

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function fromLocation()
    {
        return $this->belongsTo(InventoryLocation::class, 'from_location_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(InventoryLocation::class, 'to_location_id');
    }

    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function isStockIn()
    {
        return $this->movement_type === 'stock_in';
    }

    public function isStockOut()
    {
        return $this->movement_type === 'stock_out';
    }

    public function isAdjustment()
    {
        return $this->movement_type === 'adjustment';
    }

    public function isTransfer()
    {
        return $this->movement_type === 'transfer';
    }
}
