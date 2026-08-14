<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Message extends Model
{
    use HasFactory;

    public $table = 'messages';

    protected $fillable = ['user_id', 'chat_id', 'group_chat_id', 'text', 'read_at'];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    protected $appends = ['time'];

    protected static function booted(): void
    {
        static::deleting(function (Message $message) {
            // Per-item delete so Media::deleting fires and removes the file from storage
            $message->media()->get()->each->delete();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class, 'chat_id');
    }

    public function groupChat(): BelongsTo
    {
        return $this->belongsTo(GroupChat::class, 'group_chat_id');
    }

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    public function getTimeAttribute(): string
    {
        return date('d M Y, H:i:s', strtotime($this->attributes['created_at']));
    }
}
