<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'legal_name',
        'company_type',
        'registration_no',
        'contact_person',
        'phone',
        'email',
        'address',
        'experience',
        'eligibility_status',
        'blacklist_reason',
        'blacklisted_at',
        'created_by',
    ];

    protected $casts = [
        'blacklisted_at' => 'datetime',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function vendor()
    {
        return $this->hasOne(Vendor::class);
    }

    public function violations()
    {
        return $this->hasMany(CompanyViolation::class);
    }

    public function procurementOrders()
    {
        return $this->hasMany(ProcurementOrder::class);
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    public function isBlacklisted()
    {
        return $this->eligibility_status === 'blacklisted';
    }

    public function blacklist($reason = null)
    {
        $this->update([
            'eligibility_status' => 'blacklisted',
            'blacklist_reason' => $reason,
            'blacklisted_at' => now(),
        ]);
    }

    public function reinstate()
    {
        $this->update([
            'eligibility_status' => 'active',
            'blacklist_reason' => null,
            'blacklisted_at' => null,
        ]);
    }
}
