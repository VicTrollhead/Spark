<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'parent_post_id',
//        'post_type',
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

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Get all images related to the post.
     */
    public function images()
    {
        return $this->media()->where('file_type', 'image');
    }

    /**
     * Get all videos related to the post.
     */
    public function videos()
    {
        return $this->media()->where('file_type', 'video');
    }

    public function toArray()
    {
        return array_merge(parent::toArray(), [
            'media_urls' => $this->media->pluck('file_path'),
        ]);
    }
}
