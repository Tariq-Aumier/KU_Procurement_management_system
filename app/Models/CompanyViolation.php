<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyViolation extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'violation_date',
        'description',
        'severity',
        'status',
    ];

    protected $casts = [
        'violation_date' => 'date',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
