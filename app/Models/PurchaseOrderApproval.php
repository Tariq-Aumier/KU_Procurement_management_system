<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'step_order',
        'step_name',
        'signer_id',
        'status',
        'remarks',
        'signed_at',
        'signature_image',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function signer()
    {
        return $this->belongsTo(User::class, 'signer_id');
    }
}
