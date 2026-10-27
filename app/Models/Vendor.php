<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'account_no',
        'tax_id',
        'bank_name',
        'bank_account',
        'contact_info',
        'verification_status',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    public function isVerified()
    {
        return $this->verification_status === 'verified';
    }

    public function isPending()
    {
        return $this->verification_status === 'pending';
    }

    public function verify()
    {
        $this->update(['verification_status' => 'verified']);
    }

    public function reject()
    {
        $this->update(['verification_status' => 'rejected']);
    }
}
