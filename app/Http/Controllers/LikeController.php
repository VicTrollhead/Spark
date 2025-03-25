<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Like;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;


class LikeController extends Controller
{
    /**
     * Like a post.
     */
    public function like(Post $post): RedirectResponse
    {
        Like::firstOrCreate([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ]);

        return back()->with('success', 'Post liked successfully.');
    }


    /**
     * Unlike a post.
     */
    public function unlike(Post $post): RedirectResponse
    {
        Like::where([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ])->delete();

        return back()->with('success', 'Post unliked successfully.');
    }


    /**
     * Check if the authenticated user has liked a post.
     */
    public function isLiked(Post $post, Request $request)
    {
        $userId = Auth::id();
        $postId = $post->post_id;

        $isLiked = Like::where('user_id', $userId)
            ->where('post_id', $postId)
            ->exists();

        return back()->with(['liked' => $isLiked]);
    }
}
