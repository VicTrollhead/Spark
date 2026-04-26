<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Hashtag;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class HashtagController extends Controller
{
    public function trending(): Collection
    {
        $hashtags = Hashtag::whereHas('posts', function ($query) {
            $query->where('created_at', '>=', now()->subDays(7));
        })
            ->withCount(['posts' => function ($query) {
                $query->where('created_at', '>=', now()->subDays(7));
            }])
            ->orderByDesc('posts_count')
            ->take(5)
            ->get();

        return $hashtags->map(fn($hashtag) => [
            'id' => $hashtag->id,
            'hashtag' => $hashtag->hashtag,
            'posts_count' => $hashtag->posts_count,
        ]);
    }

    public function popular(Request $request): Collection
    {
        $hashtags = Hashtag::withCount('posts')
            ->orderByDesc('posts_count')
            ->take(5)
            ->get();

        return $hashtags->map(fn($hashtag) => [
            'id' => $hashtag->id,
            'hashtag' => $hashtag->hashtag,
            'uses_count' => $hashtag->posts_count,
        ]);
    }

    public function postsByHashtag(string $hashtag): Response
    {
        $currentUser = Auth::user();

        if (!$currentUser) {
            abort(403, 'Unauthorized');
        }

        $hashtagModel = Hashtag::where('hashtag', $hashtag)
            ->withCount('posts')
            ->firstOrFail();

        $posts = postBaseQuery($currentUser)
            ->whereHas('hashtags', function ($query) use ($hashtag) {
                $query->where('hashtag', $hashtag);
            })
            ->latest()
            ->paginate(15)
            ->through(fn($post) => formatPostForFrontend($post, $currentUser));

        return Inertia::render('post/posts-by-hashtag', [
            'user' => $currentUser,
            'posts' => $posts,
            'hashtag' => [
                'id' => $hashtagModel->id,
                'hashtag' => $hashtagModel->hashtag,
                'uses_count' => $hashtagModel->posts_count,
            ],
        ]);
    }

    public function showPopular(Request $request): Response
    {
        $sort = $request->query('sort', 'likes');

        $hashtags = Hashtag::withCount('posts')
            ->with(['posts' => function ($query) {
                $query->withCount('likes');
            }])
            ->get()
            ->map(function ($hashtag) {
                $totalLikes = $hashtag->posts->sum('likes_count');

                return [
                    'id' => $hashtag->id,
                    'hashtag' => $hashtag->hashtag,
                    'posts_count' => $hashtag->posts_count,
                    'total_likes' => $totalLikes,
                ];
            });

        if ($sort === 'posts') {
            $hashtags = $hashtags->sortByDesc('posts_count')->values();
        } else {
            $hashtags = $hashtags->sortByDesc('total_likes')->values();
        }

        return Inertia::render('post/popular-hashtags', [
            'hashtags' => $hashtags,
            'sort' => $sort,
        ]);
    }
}
