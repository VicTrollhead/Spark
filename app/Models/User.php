<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'password',
        'name',
        'bio',
        'location',
        'website',
        'date_of_birth',
        'is_verified',
        'email_verified_at',
        'is_private',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
            'is_private' => 'boolean',
            'date_of_birth' => 'date',
            'status' => 'string',
        ];
    }

    // Polymorphic Relationship to Media
    public function profileImage(): HasOne
    {
        return $this->hasOne(Media::class, 'mediable_id')
            ->where('mediable_type', User::class)
            ->where('file_type', 'profile');
    }

    public function coverImage(): HasOne
    {
        return $this->hasOne(Media::class, 'mediable_id')
            ->where('mediable_type', User::class)
            ->where('file_type', 'cover');
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'followee_id', 'follower_id');
    }

    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'followee_id');
    }

    public function friends(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'followee_id')
            ->join('follows as f2', function ($join) {
                $join->on('follows.followee_id', '=', 'f2.follower_id')
                    ->where('f2.followee_id', '=', $this->id);
            })
            ->select('users.*');
    }

    public function isFollowing(User $user): bool
    {
        return $this->following()->where('followee_id', $user->id)->exists();
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'favorites', 'user_id', 'post_id');
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'likes', 'user_id', 'post_id');
    }

    public function followingPosts(): HasManyThrough
    {
        return $this->hasManyThrough(
            Post::class,
            Follow::class,
            'follower_id',
            'user_id',
            'id',
            'followee_id'
        );
    }
}
