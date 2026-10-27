<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'item_type',
        'category',
        'description',
        'unit',
        'quantity_on_hand',
        'min_stock',
        'max_stock',
        'reorder_point',
        'inventory_location_id',
        'supplier_company_id',
        'batch_number',
        'serial_number',
        'received_date',
        'expiry_date',
        'condition',
        'notes',
        'unit_cost',
        'currency',
    ];

    protected $casts = [
        'quantity_on_hand' => 'decimal:3',
        'min_stock' => 'decimal:3',
        'max_stock' => 'decimal:3',
        'reorder_point' => 'decimal:3',
        'received_date' => 'date',
        'expiry_date' => 'date',
        'unit_cost' => 'decimal:2',
    ];

    public function inventoryLocation()
    {
        return $this->belongsTo(InventoryLocation::class);
    }

    public function supplierCompany()
    {
        return $this->belongsTo(Company::class, 'supplier_company_id');
    }

    public function movements()
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function isBelowReorderPoint()
    {
        return $this->quantity_on_hand <= $this->reorder_point;
    }

    public function isExpiringSoon($days = 30)
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date <= now()->addDays($days);
    }

    public function isExpired()
    {
        if (!$this->expiry_date) {
            return false;
        }
        return $this->expiry_date < now();
    }

    public function needsAttention()
    {
        return $this->isBelowReorderPoint() || $this->isExpiringSoon();
    }

    public function adjustQuantity($quantity, $type, $referenceNo = null, $notes = null, $performedBy = null)
    {
        $previousQuantity = $this->quantity_on_hand;
        $newQuantity = $previousQuantity + $quantity;

        if ($newQuantity < 0) {
            throw new \Exception('Cannot reduce quantity below zero');
        }

        $this->update(['quantity_on_hand' => $newQuantity]);

        $this->movements()->create([
            'movement_type' => $type,
            'quantity' => $quantity,
            'previous_quantity' => $previousQuantity,
            'new_quantity' => $newQuantity,
            'reference_no' => $referenceNo,
            'notes' => $notes,
            'performed_by' => $performedBy,
            'movement_at' => now(),
        ]);

        return $newQuantity;
    }
}
