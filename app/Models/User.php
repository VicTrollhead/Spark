<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'name',
        'bio',
        'profile_image_url',
        'cover_image_url',
        'location',
        'website',
        'date_of_birth',
        'is_verified',
        'is_private',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
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

    /**
     * Automatically hash password when setting it.
     */
//    protected function password(): Attribute
//    {
//        return Attribute::make(
//            set: fn ($value) => bcrypt($value),
//        );
//    }

    public function followers() : BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'followee_id', 'follower_id');
    }

    public function following() :BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'followee_id');
    }

    /**
     * Check if a user is following another user.
     */
    public function isFollowing(User $user): bool
    {
        return $this->following()->where('followee_id', $user->id)->exists();
    }
}
