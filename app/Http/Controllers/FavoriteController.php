<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\PostEngagementChanged;
use App\Models\Favorite;
use App\Models\Notification;
use App\Models\Post;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class FavoriteController extends Controller
{
    public function addFavorite(Post $post): RedirectResponse
    {
        if (Gate::denies('view', $post)) {
            abort(403, 'You cannot favorite this post.');
        }

        Favorite::firstOrCreate([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ]);

        if ($post->user_id !== Auth::id()) {
            NotificationService::create([
                'user_id' => $post->user_id,
                'source_user_id' => Auth::id(),
                'type' => 'favorite',
                'post_id' => $post->id,
            ]);
        }

        $this->broadcastEngagement($post);

        return back()->with('success', 'Post liked successfully.');
    }

    public function removeFavorite(Post $post): RedirectResponse
    {
        Favorite::where([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ])->delete();

        Notification::where('type', 'favorite')
            ->where('source_user_id', Auth::id())
            ->where('post_id', $post->id)
            ->delete();

        $this->broadcastEngagement($post);

        return back()->with('success', 'Post unliked successfully.');
    }

    public function isFavorited(Post $post, Request $request): RedirectResponse
    {
        $userId = Auth::id();
        $postId = $post->post_id;

        $isFavorited = Favorite::where('user_id', $userId)
            ->where('post_id', $postId)
            ->exists();

        return back()->with(['favorited' => $isFavorited]);
    }

    private function broadcastEngagement(Post $post): void
    {
        broadcast(new PostEngagementChanged(
            $post->id,
            $post->likes()->count(),
            $post->favorites()->count(),
            $post->repostedByUsers()->count(),
        ))->toOthers();
    }
}
