<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hashtag extends Model
{
    protected $fillable = [
        'hashtag',
    ];

    public function posts()
    {
        return $this->belongsToMany(Post::class, 'post_hashtags');
    }
}
