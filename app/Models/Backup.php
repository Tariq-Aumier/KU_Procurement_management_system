<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Backup extends Model
{
    use HasFactory;

    protected $fillable = [
        'storage_path',
        'checksum',
        'status',
        'created_by',
        'retention_until',
    ];

    protected $casts = [
        'retention_until' => 'datetime',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isFailed()
    {
        return $this->status === 'failed';
    }

    public function isExpired()
    {
        return $this->retention_until && $this->retention_until->isPast();
    }

    public function getFilePath()
    {
        return storage_path('app/' . $this->storage_path);
    }

    public function getFileExists()
    {
        return file_exists($this->getFilePath());
    }

    public function getFileSize()
    {
        if (!$this->getFileExists()) {
            return 0;
        }
        return filesize($this->getFilePath());
    }

    public function getHumanFileSize()
    {
        $bytes = $this->getFileSize();
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } elseif ($bytes > 1) {
            return $bytes . ' bytes';
        } elseif ($bytes == 1) {
            return '1 byte';
        } else {
            return '0 bytes';
        }
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'completed')
                    ->where(function ($q) {
                        $q->whereNull('retention_until')
                          ->orWhere('retention_until', '>', now());
                    });
    }

    public function scopeExpired($query)
    {
        return $query->where('retention_until', '<', now());
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }
}
