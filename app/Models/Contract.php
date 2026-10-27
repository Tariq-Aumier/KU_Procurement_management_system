<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'contract_no',
        'award_id',
        'company_id',
        'title',
        'amount',
        'currency',
        'tier',
        'start_date',
        'end_date',
        'status',
        'progress_percent',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'progress_percent' => 'decimal:2',
    ];

    public function award()
    {
        return $this->belongsTo(Award::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function progressUpdates()
    {
        return $this->hasMany(ContractProgressUpdate::class);
    }

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function getTierLabel()
    {
        return match($this->tier) {
            'tier1' => 'Small (0 – 5K)',
            'tier2' => 'Medium (5K – 50K)',
            'tier3' => 'Large (50K – 500K)',
            'tier4' => 'Enterprise (500K+)',
            default => 'Unknown',
        };
    }

    public function updateProgress($percent, $notes = null)
    {
        $this->update(['progress_percent' => $percent]);

        $this->progressUpdates()->create([
            'progress_percent' => $percent,
            'update_date' => now(),
            'notes' => $notes,
        ]);

        if ($percent >= 100) {
            $this->update(['status' => 'completed']);
        }
    }

    public function calculateTier()
    {
        $amount = (float) $this->amount;

        if ($amount <= 5000) {
            return 'tier1';
        } elseif ($amount <= 50000) {
            return 'tier2';
        } elseif ($amount <= 500000) {
            return 'tier3';
        } else {
            return 'tier4';
        }
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($contract) {
            if (empty($contract->tier)) {
                $contract->tier = $contract->calculateTier();
            }
        });

        static::updating(function ($contract) {
            if ($contract->isDirty('amount')) {
                $contract->tier = $contract->calculateTier();
            }
        });
    }
}
