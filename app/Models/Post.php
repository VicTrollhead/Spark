<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class Post extends Model
{
    use HasFactory;

    /**
     * Use slug instead of ID for route model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::creating(function (Post $post) {
            if (empty($post->slug)) {
                $post->slug = static::generateUniqueSlug();
            }
        });

        static::deleting(function (Post $post) {
            // Per-item delete so Media::deleting fires and removes the file from storage
            $post->media()->get()->each->delete();
        });
    }

    public static function generateUniqueSlug(): string
    {
        do {
            $slug = Str::random(10);
        } while (static::where('slug', $slug)->exists());

        return $slug;
    }

    /**
     * Scope posts visible to the given user: public, own, or from followed users.
     */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        return $query->where(function ($q) use ($user) {
            $q->where('posts.is_private', 0);

            if ($user) {
                $q->orWhere(function ($sub) use ($user) {
                    $sub->where('posts.user_id', $user->id)
                        ->orWhereHas('user.followers', function ($fq) use ($user) {
                            $fq->where('follower_id', $user->id);
                        });
                });
            }
        });
    }

    /**
     * Standard eager-load set for post listings.
     */
    public const STANDARD_EAGER_LOADS = [
        'user.profileImage',
        'comments',
        'likes',
        'media',
        'hashtags',
        'favorites',
        'repostedByUsers.profileImage',
        'parentPost.user',
        'quotePost.user.profileImage',
        'quotePost.media',
        'replies',
        'quotedByPosts',
        'poll.options',
        'poll.votes',
    ];

    protected $fillable = [
        'user_id',
        'slug',
        'content',
        'parent_post_id',
        'quote_post_id',
        'is_deleted',
        'is_private',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
        'is_private' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function parentPost()
    {
        return $this->belongsTo(Post::class, 'parent_post_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Post::class, 'parent_post_id');
    }

    public function quotePost()
    {
        return $this->belongsTo(Post::class, 'quote_post_id');
    }

    public function quotedByPosts(): HasMany
    {
        return $this->hasMany(Post::class, 'quote_post_id');
    }

    public function likes()
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function hashtags()
    {
        return $this->belongsToMany(Hashtag::class, 'post_hashtags');
    }

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    public function reposts()
    {
        return $this->hasMany(Repost::class);
    }

    public function repostedByUsers()
    {
        return $this->belongsToMany(User::class, 'reposts')->withPivot('created_at');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function poll(): HasOne
    {
        return $this->hasOne(Poll::class);
    }
}
