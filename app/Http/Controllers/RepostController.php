<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Repost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RepostController extends Controller
{
    public function repost(Post $post): RedirectResponse
    {
        Repost::firstOrCreate([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ]);

        return back()->with('success', 'Post reposted successfully.');
    }

    public function undo(Post $post): RedirectResponse
    {
        Repost::where([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ])->delete();

        return back()->with('success', 'Repost removed successfully.');
    }
}
