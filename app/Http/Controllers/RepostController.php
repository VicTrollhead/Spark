<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\PostEngagementChanged;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Repost;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class RepostController extends Controller
{
    public function repost(Post $post): RedirectResponse
    {
        if ($post->is_private || $post->user->is_private) {
            abort(403, 'Cannot repost a private post.');
        }

        Repost::firstOrCreate([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ]);

        if ($post->user_id !== Auth::id()) {
            NotificationService::create([
                'user_id' => $post->user_id,
                'source_user_id' => Auth::id(),
                'type' => 'repost',
                'post_id' => $post->id,
            ]);
        }

        $this->broadcastEngagement($post);

        return back()->with('success', 'Post reposted successfully.');
    }

    public function undo(Post $post): RedirectResponse
    {
        Repost::where([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ])->delete();

        Notification::where('type', 'repost')
            ->where('source_user_id', Auth::id())
            ->where('post_id', $post->id)
            ->where('user_id', $post->user_id)
            ->delete();

        $this->broadcastEngagement($post);

        return back()->with('success', 'Repost removed successfully.');
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
