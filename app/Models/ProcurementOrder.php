<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProcurementOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'procurement_orders';

    protected $fillable = [
        'order_no',
        'title',
        'office_id',
        'company_id',
        'category',
        'priority',
        'status',
        'requested_date',
        'required_date',
        'amount',
        'equipment',
        'items',
        'currency',
        'description',
        'created_by',
    ];

    protected $casts = [
        'requested_date' => 'date',
        'required_date' => 'date',
        'amount' => 'decimal:2',
        'equipment' => 'decimal:2',
        'items' => 'decimal:2',
    ];

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'procurement_order_id');
    }

    public function rfqs()
    {
        return $this->hasMany(Rfq::class);
    }

    public function isDraft()
    {
        return $this->status === 'draft';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isInProgress()
    {
        return $this->status === 'in_progress';
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isCancelled()
    {
        return $this->status === 'cancelled';
    }

    public function isUrgent()
    {
        return in_array($this->priority, ['urgent', 'high']);
    }

    public function submit()
    {
        $this->update(['status' => 'pending']);
    }

    public function approve()
    {
        $this->update(['status' => 'in_progress']);
    }

    public function complete()
    {
        $this->update(['status' => 'completed']);
    }

    public function cancel()
    {
        $this->update(['status' => 'cancelled']);
    }

    public function generateOrderNumber()
    {
        $year = date('Y');
        $prefix = "PO-{$year}-";
        $lastNumber = static::where('order_no', 'like', "{$prefix}%")
            ->orderBy('order_no', 'desc')
            ->value('order_no');

        if ($lastNumber) {
            $lastSeq = (int) str_replace($prefix, '', $lastNumber);
            $newSeq = $lastSeq + 1;
        } else {
            $newSeq = 1;
        }

        return $prefix . str_pad($newSeq, 5, '0', STR_PAD_LEFT);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_no)) {
                $order->order_no = $order->generateOrderNumber();
            }
        });
    }
}
