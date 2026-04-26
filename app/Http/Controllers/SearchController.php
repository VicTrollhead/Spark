<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Hashtag;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function index(Request $request): Response
    {
        $query = trim($request->query('q', ''));
        $tab = $request->query('tab', 'posts');
        $currentUser = Auth::user();

        $posts = [];
        $users = [];
        $hashtags = [];

        if ($query !== '') {
            if ($tab === 'posts') {
                $posts = postBaseQuery($currentUser)
                    ->where(function ($q) use ($query) {
                        $q->where('content', 'like', "%{$query}%")
                          ->orWhereHas('hashtags', function ($hq) use ($query) {
                              $hq->where('hashtag', 'like', "%{$query}%");
                          });
                    })
                    ->latest()
                    ->take(30)
                    ->get()
                    ->map(fn($post) => formatPostForFrontend($post, $currentUser))
                    ->values();
            }

            if ($tab === 'users') {
                $users = User::with('profileImage')
                    ->withCount('followers')
                    ->where(function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%")
                          ->orWhere('username', 'like', "%{$query}%");
                    })
                    ->take(30)
                    ->get()
                    ->map(fn($user) => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'profile_image' => $user->profileImage,
                        'followers_count' => $user->followers_count,
                        'is_verified' => $user->is_verified,
                    ]);
            }

            if ($tab === 'hashtags') {
                $hashtags = Hashtag::withCount('posts')
                    ->where('hashtag', 'like', "%{$query}%")
                    ->orderByDesc('posts_count')
                    ->take(30)
                    ->get()
                    ->map(fn($tag) => [
                        'id' => $tag->id,
                        'hashtag' => $tag->hashtag,
                        'posts_count' => $tag->posts_count,
                    ]);
            }
        }

        return Inertia::render('search', [
            'query' => $query,
            'tab' => $tab,
            'posts' => $posts,
            'users' => $users,
            'hashtags' => $hashtags,
        ]);
    }
}
