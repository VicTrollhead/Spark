<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GroupChat extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'creator_id'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_chat_user')->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'group_chat_id');
    }

    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class, 'group_chat_id')->latestOfMany();
    }
}
