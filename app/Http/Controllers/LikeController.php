<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Post;
use App\Services\NotificationService;
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
    public function like(Post $post): RedirectResponse
    {
        Like::firstOrCreate([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ]);

        if ($post->user_id !== Auth::id()) {
            NotificationService::create([
                'user_id' => $post->user_id,
                'source_user_id' => Auth::id(),
                'type' => 'like',
                'post_id' => $post->id,
            ]);
        }

        return back()->with('success', 'Post liked successfully.');
    }

    public function unlike(Post $post): RedirectResponse
    {
        Like::where([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ])->delete();

        Notification::where('type', 'like')
            ->where('source_user_id', Auth::id())
            ->where('post_id', $post->id)
            ->where('user_id', $post->user_id)
            ->delete();

        return back()->with('success', 'Post unliked successfully.');
    }

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
