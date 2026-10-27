<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BidItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'bid_id',
        'rfq_item_id',
        'unit_price',
        'quantity_offered',
        'line_total',
        'compliance_status',
        'notes',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity_offered' => 'decimal:3',
        'line_total' => 'decimal:2',
    ];

    public function bid()
    {
        return $this->belongsTo(Bid::class);
    }

    public function rfqItem()
    {
        return $this->belongsTo(RfqItem::class);
    }

    public function isCompliant()
    {
        return $this->compliance_status === 'compliant';
    }

    public function markCompliant()
    {
        $this->update(['compliance_status' => 'compliant']);
    }

    public function markNonCompliant($notes = null)
    {
        $this->update([
            'compliance_status' => 'non_compliant',
            'notes' => $notes,
        ]);
    }
}
