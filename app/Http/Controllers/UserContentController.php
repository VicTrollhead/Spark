<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class UserContentController extends Controller
{
    public function favorites(Request $request): Response
    {
        $currentUser = Auth::user();

        if (! $currentUser) {
            abort(403, 'Unauthorized');
        }

        $sort = $request->input('sort', 'latest');

        $favoritedPostsQuery = $currentUser->favorites()
            ->with(Post::STANDARD_EAGER_LOADS)
            ->visibleTo($currentUser);

        if (in_array($sort, ['latest', 'oldest'])) {
            $sortDirection = $sort === 'oldest' ? 'oldest' : 'latest';
            $favoritedPostsQuery->$sortDirection();
            $posts = $favoritedPostsQuery->paginate(15)
                ->through(fn ($post) => formatPostForFrontend($post, $currentUser));
        } else {
            $allPosts = $favoritedPostsQuery->get();

            $allPosts = match ($sort) {
                'most_liked' => $allPosts->sortByDesc(fn ($post) => $post->likes->count())->values(),
                'reposted_friends' => $allPosts->filter(function ($post) use ($currentUser) {
                    return $currentUser->following->contains('id', $post->user_id);
                })->values(),
                default => $allPosts,
            };

            $page = $request->input('page', 1);
            $perPage = 15;
            $posts = new LengthAwarePaginator(
                $allPosts->forPage($page, $perPage)->values()->map(fn ($post) => formatPostForFrontend($post, $currentUser)),
                $allPosts->count(),
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );
        }

        return Inertia::render('user/favorites', [
            'user' => $currentUser,
            'posts' => $posts,
            'filters' => [
                'sort' => $sort,
            ],
        ]);
    }

    public function liked(Request $request): Response
    {
        $currentUser = Auth::user();

        if (! $currentUser) {
            abort(403, 'Unauthorized');
        }

        $sort = $request->query('sort', 'latest');

        $followingIds = $currentUser->following->pluck('id');

        $likedPostIds = Like::where('user_id', $currentUser->id)
            ->where('likeable_type', Post::class)
            ->pluck('likeable_id');

        $likedQuery = Post::with(Post::STANDARD_EAGER_LOADS)
            ->whereIn('id', $likedPostIds)
            ->visibleTo($currentUser);

        switch ($sort) {
            case 'oldest':
                $likedQuery->oldest();
                break;
            case 'most_liked':
                $likedQuery->withCount('likes')->orderByDesc('likes_count');
                break;
            case 'following':
                $likedQuery->whereIn('posts.user_id', $followingIds)->latest();
                break;
            case 'latest':
            default:
                $likedQuery->latest();
                break;
        }

        $posts = $likedQuery->paginate(15)
            ->through(fn ($post) => formatPostForFrontend($post, $currentUser));

        return Inertia::render('user/liked', [
            'user' => $currentUser,
            'posts' => $posts,
            'filters' => [
                'sort' => $sort,
            ],
        ]);
    }

    public function followingPosts(Request $request): Response
    {
        $currentUser = Auth::user();

        if (! $currentUser) {
            abort(403, 'Unauthorized');
        }

        $sort = $request->query('sort', 'latest');

        $query = $currentUser->followingPosts()
            ->with(Post::STANDARD_EAGER_LOADS);

        switch ($sort) {
            case 'oldest':
                $query->oldest();
                break;
            case 'most_liked':
                $query->withCount('likes')->orderByDesc('likes_count');
                break;
            default:
                $query->latest();
                break;
        }

        $posts = $query->paginate(15)
            ->through(fn ($post) => formatPostForFrontend($post, $currentUser));

        return Inertia::render('user/following-posts', [
            'user' => $currentUser,
            'posts' => $posts,
            'filters' => [
                'sort' => $sort,
            ],
        ]);
    }

    public function reposts(Request $request, ?User $user = null): Response
    {
        $currentUser = Auth::user();
        $user = $user ?? $currentUser;

        if (! $user) {
            abort(404, 'User not found');
        }

        $sort = $request->input('sort', 'latest');

        $repostedPostsQuery = Post::whereHas('repostedByUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(Post::STANDARD_EAGER_LOADS)
            ->visibleTo($currentUser);

        $repostTimes = \App\Models\Repost::where('user_id', $user->id)->pluck('created_at', 'post_id');

        $allPosts = $repostedPostsQuery->get();

        $allPosts->each(function ($post) use ($repostTimes) {
            $post->reposted_at = $repostTimes[$post->id] ?? $post->created_at;
        });

        $allPosts = match ($sort) {
            'oldest' => $allPosts->sortBy('reposted_at')->values(),
            'most_liked' => $allPosts->sortByDesc(fn ($post) => $post->likes->count())->values(),
            'reposted_friends' => $allPosts->filter(function ($post) use ($currentUser) {
                return $currentUser->following->contains('id', $post->user_id);
            })->values(),
            default => $allPosts->sortByDesc('reposted_at')->values(),
        };

        $page = $request->input('page', 1);
        $perPage = 15;
        $posts = new LengthAwarePaginator(
            $allPosts->forPage($page, $perPage)->values()->map(fn ($post) => formatPostForFrontend($post, $currentUser)),
            $allPosts->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('user/reposts', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'profile_image' => $user->profileImage,
                'is_verified' => $user->is_verified,
            ],
            'posts' => $posts,
            'filters' => [
                'sort' => $sort,
            ],
        ]);
    }
}
