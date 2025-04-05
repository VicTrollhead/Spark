<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function addFavorite(Post $post): RedirectResponse
    {
        Favorite::firstOrCreate([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ]);

        return back()->with('success', 'Post liked successfully.');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function removeFavorite(Post $post): RedirectResponse
    {
        Favorite::where([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
        ])->delete();

        return back()->with('success', 'Post unliked successfully.');
    }

    public function isFavorited(Post $post, Request $request)
    {
        $userId = Auth::id();
        $postId = $post->post_id;

        $isFavorited = Favorite::where('user_id', $userId)
            ->where('post_id', $postId)
            ->exists();

        return back()->with(['favorited' => $isFavorited]);
    }
}
