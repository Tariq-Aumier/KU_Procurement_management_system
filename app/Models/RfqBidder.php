<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RfqBidder extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfq_form_id',
        'name',
        'address',
        'contact_person',
        'contact_phone',
        'email',
        'is_winner',
        'submitted_at',
        'remarks',
        'has_business_license',
        'has_tax_id',
        'has_manufacturer_auth',
        'signature_image',
        'stamp_image',
    ];

    protected $casts = [
        'is_winner' => 'boolean',
        'has_business_license' => 'boolean',
        'has_tax_id' => 'boolean',
        'has_manufacturer_auth' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function rfqForm()
    {
        return $this->belongsTo(RfqFormNew::class, 'rfq_form_id');
    }

    public function prices()
    {
        return $this->hasMany(RfqBidderPrice::class);
    }

    public function getGrandTotalAttribute()
    {
        return $this->prices()->sum('line_total');
    }
}
