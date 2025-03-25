<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'parent_post_id',
        'post_type',
        'is_deleted',
        'is_public',
        'likes_count',
        'is_liked',
        'comments_count',
    ];

    //public $timestamps = false;

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function parentPost()
    {
        return $this->belongsTo(Post::class, 'parent_post_id');
    }

    public function replies() : HasMany
    {
        return $this->hasMany(Post::class, 'parent_post_id');
    }

    public function likes() : HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function comments() : HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
