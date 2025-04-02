<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{

    public function view(?User $user, Post $post): bool
    {
        // Allow viewing if post is public
        if (!$post->is_private) {
            return true;
        }

        // If the user is the post owner, allow viewing
        if ($user && $user->id === $post->user_id) {
            return true;
        }

        // Allow viewing if the user is a follower of the post owner
        if ($user && $post->user->followers()->where('follower_id', $user->id)->exists()) {
            return true;
        }

        // Default case: the user cannot view the post
        return false;
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
