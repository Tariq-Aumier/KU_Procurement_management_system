<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationCommitteeMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'evaluation_form_id',
        'member_name',
        'position',
        'signature',
        'signed_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    public function evaluationForm()
    {
        return $this->belongsTo(EvaluationForm::class);
    }
}
