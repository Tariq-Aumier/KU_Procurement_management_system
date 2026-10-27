<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComparisonCommitteeMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'comparison_sheet_id',
        'member_name',
        'position',
        'signature_image',
        'has_signed',
        'signed_at',
        'remarks',
    ];

    protected $casts = [
        'has_signed' => 'boolean',
        'signed_at' => 'datetime',
    ];

    public function comparisonSheet()
    {
        return $this->belongsTo(ComparisonSheet::class);
    }
}
