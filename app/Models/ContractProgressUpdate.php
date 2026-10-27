<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContractProgressUpdate extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'progress_percent',
        'update_date',
        'notes',
        'submitted_by',
    ];

    protected $casts = [
        'progress_percent' => 'decimal:2',
        'update_date' => 'date',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
