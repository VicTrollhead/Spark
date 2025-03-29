<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{

    public function view(?User $user, Post $post): bool
    {

        if (!$post->is_private) {
            return true;
        }

        if (!$user) {
            return false;
        }

        if ($user->id === $post->user_id) {
            return true;
        }

        return  $post->user->followers()->where('follower_id', $user->id)->exists();
    }





//    public function view(?User $user, Post $post): bool
//    {
//        if ($post->user->is_private) {
//            if (!$user) {
//                return false;
//            }
//
//            if ($user->id === $post->user_id) {
//                return true;
//            }
//
//            return $post->user->followers()->where('follower_id', $user->id)->exists();
//        }
//
//        if (!$post->is_private) {
//            return true;
//        }
//
//        if (!$user) {
//            return false;
//        }
//
//        if ($user->id === $post->user_id) {
//            return true;
//        }
//
//        return $post->user->followers()->where('follower_id', $user->id)->exists();
//    }

}
