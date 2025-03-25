<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_path',
        'file_type',
        'mediable_id',
        'mediable_type',
    ];

    /**
     * Get the parent mediable model (Post or User).
     */
    public function mediable()
    {
        return $this->morphTo();
    }
}
