<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Models\Media;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use AuthorizesRequests;


    public function show(Request $request, User $user = null): Response
    {
        $currentUser = Auth::user();
        $user = $user ?? $currentUser;

        if (!$user) {
            abort(404, 'User not found');
        }

        $sort = $request->input('sort', 'latest');
        $canViewFullProfile = Gate::allows('view', $user);
        $user->loadCount(['followers', 'following', 'repostedPosts']);

        $originalPostsQuery = $user->posts()
            ->with(['user.profileImage', 'comments', 'likes', 'media', 'hashtags', 'favorites', 'repostedByUsers'])
            ->where(function ($query) use ($currentUser) {
                $query->where('is_private', 0);

                if ($currentUser) {
                    $query->orWhere(function ($subQuery) use ($currentUser) {
                        $subQuery->where('user_id', $currentUser->id)
                            ->orWhereHas('user.followers', function ($followersQuery) use ($currentUser) {
                                $followersQuery->where('follower_id', $currentUser->id);
                            });
                    });
                }
            });

        $repostedPostsQuery = Post::whereHas('repostedByUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with(['user.profileImage', 'comments', 'likes', 'media', 'hashtags', 'favorites', 'repostedByUsers']);

        if ($sort === 'reposts') {
            $originalPosts = collect();
            $repostedPosts = $repostedPostsQuery->latest()->get();
        } elseif ($sort === 'originals') {
            $originalPosts = $originalPostsQuery->latest()->get();
            $repostedPosts = collect();
        } else {
            $originalPosts = $originalPostsQuery->get();
            $repostedPosts = $repostedPostsQuery->get();
        }

        $combinedPosts = $originalPosts->merge($repostedPosts);

        if ($sort === 'most_liked') {
            $combinedPosts = $combinedPosts->sortByDesc(fn($post) => $post->likes->count())->values();
        } elseif ($sort === 'oldest') {
            $combinedPosts = $combinedPosts->sortBy('created_at')->values();
        } else {
            $combinedPosts = $combinedPosts->sortByDesc('created_at')->values();
        }

        $posts = $combinedPosts->map(function ($post) use ($user, $currentUser) {
            return [
                'id' => $post->id,
                'content' => $post->content,
                'created_at' => $post->created_at->format('n/j/Y'),
                'user' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'username' => $post->user->username,
                    'profile_image_url' => $post->user->profileImage?->url,
                ],
                'media' => $post->media->map(fn ($media) => [
                    'file_path' => $media->file_path,
                    'file_type' => $media->file_type,
                ]),
                'hashtags' => $post->hashtags->map(fn ($tag) => [
                    'id' => $tag->id,
                    'hashtag' => $tag->hashtag,
                ]),
                'is_private' => $post->is_private,
                'likes_count' => $post->likes->count(),
                'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                'favorites_count' => $post->favorites->count(),
                'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                'comments_count' => $post->comments->count(),
                'is_reposted' => $user->repostedPosts->contains($post->id),
                'reposts_count' => $post->repostedByUsers->count(),
            ];
        });

        return Inertia::render('user/show', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $canViewFullProfile ? $user->name : null,
                'bio' => $canViewFullProfile ? $user->bio : null,
                'profile_image_url' => $user->profileImage?->url,
                'cover_image_url' => $canViewFullProfile && $user->coverImage ? $user->coverImage->url : null,
                'location' => $canViewFullProfile ? $user->location : null,
                'website' => $canViewFullProfile ? $user->website : null,
                'date_of_birth' => $canViewFullProfile ? optional($user->date_of_birth)->format('F j, Y') : null,
                'is_verified' => $user->is_verified,
                'is_private' => $user->is_private,
                'status' => $canViewFullProfile ? $user->status : null,
                'created_at' => $canViewFullProfile ? $user->created_at->format('F j, Y') : null,
                'followers_count' => $user->followers_count,
                'following_count' => $user->following_count,
                'is_following' => Auth::check() && $user->followers()->where('follower_id', Auth::id())->exists(),
                'canViewFullProfile' => $canViewFullProfile,
            ],
            'posts' => $posts,
            'filters' => [
                'sort' => $sort,
            ],
        ]);
    }





    public function users(Request $request): Response
    {
        $currentUser = Auth::user();
        $sort = $request->query('sort', 'newest');

        $usersQuery = User::with('profileImage')->withCount('followers');

        switch ($sort) {
            case 'oldest':
                $usersQuery->oldest();
                break;
            case 'popular':
                $usersQuery->orderByDesc('followers_count');
                break;
            case 'least_followed':
                $usersQuery->orderBy('followers_count');
                break;
            case 'following':
                if ($currentUser) {
                    $usersQuery->whereHas('followers', fn($query) => $query->where('follower_id', $currentUser->id));
                }
                break;
            case 'followers':
                if ($currentUser) {
                    $usersQuery->whereHas('following', fn($query) => $query->where('followee_id', $currentUser->id));
                }
                break;
            case 'mutual_subscribers':
                if ($currentUser) {
                    $usersQuery->whereHas('followers', function ($query) use ($currentUser) {
                        $query->where('follower_id', $currentUser->id);
                    })->whereHas('following', function ($query) use ($currentUser) {
                        $query->where('followee_id', $currentUser->id);
                    });
                }
                break;
            default:
                $usersQuery->latest();
                break;
        }

        $users = $usersQuery->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'profile_image_url' => $user->profileImage ? $user->profileImage->url : null,
                'followers_count' => $user->followers_count,
            ];
        });

        return Inertia::render('user-dashboard', [
            'users' => $users,
            'sort' => $sort,
        ]);
    }

    public function search(Request $request, string $searchText = ''): Response
    {
        $currentUser = Auth::user();
        $sort = $request->query('sort', 'newest');

        $usersQuery = User::with('profileImage')->withCount('followers');

        if (trim($searchText) !== '') {
            $usersQuery->where(function ($query) use ($searchText) {
                $query->where('name', 'like', "%{$searchText}%")
                    ->orWhere('username', 'like', "%{$searchText}%");
            });
        }

        switch ($sort) {
            case 'oldest':
                $usersQuery->oldest();
                break;
            case 'popular':
                $usersQuery->orderByDesc('followers_count');
                break;
            case 'least_followed':
                $usersQuery->orderBy('followers_count');
                break;
            case 'following':
                if ($currentUser) {
                    $usersQuery->whereHas('followers', fn($query) => $query->where('follower_id', $currentUser->id));
                }
                break;
            case 'followers':
                if ($currentUser) {
                    $usersQuery->whereHas('following', fn($query) => $query->where('followee_id', $currentUser->id));
                }
                break;
            case 'mutual_subscribers':
                if ($currentUser) {
                    $usersQuery->whereHas('followers', function ($query) use ($currentUser) {
                        $query->where('follower_id', $currentUser->id);
                    })->whereHas('following', function ($query) use ($currentUser) {
                        $query->where('followee_id', $currentUser->id);
                    });
                }
                break;
            default:
                $usersQuery->latest();
                break;
        }

        $users = $usersQuery->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'profile_image_url' => $user->profileImage ? $user->profileImage->url : null,
                'followers_count' => $user->followers_count,
            ];
        });

        return Inertia::render('user/search-users', [
            'users' => $users,
            'sort' => $sort,
            'searchText' => $searchText,
        ]);
    }

    public function usersList(Request $request)
    {
        $usersQuery = User::with('profileImage')->withCount('followers');

        $users = $usersQuery->oldest()->take(3)->get();

        return $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'profile_image_url' => $user->profileImage ? $user->profileImage->url : null,
                'followers_count' => $user->followers_count,
            ];
        });
    }


    public function favorites(): Response
    {
        $currentUser = Auth::user();

        if (!$currentUser) {
            abort(403, 'Unauthorized');
        }

        $favoritedPosts = $currentUser->favorites()
            ->with(['user.profileImage', 'comments', 'likes', 'media'])
            ->where(function ($query) use ($currentUser) {
                $query->where('posts.is_private', 0)
                ->orWhere(function ($subQuery) use ($currentUser) {
                    $subQuery->where('posts.user_id', $currentUser->id)
                    ->orWhereHas('user.followers', function ($followersQuery) use ($currentUser) {
                        $followersQuery->where('follower_id', $currentUser->id);
                    });
                });
            })
            ->latest()
            ->get()
            ->filter(fn ($post) => $post->is_private == 0 || $post->user_id == $currentUser->id || $post->user->followers->contains('id', $currentUser->id))
            ->map(function ($post) use ($currentUser) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'created_at' => $post->created_at->format('n/j/Y'),
                    'user' => [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                        'username' => $post->user->username,
                        'profile_image_url' => $post->user->profileImage ? $post->user->profileImage->url : null,
                    ],
                    'media' => $post->media->map(fn ($media) => [
                        'file_path' => $media->file_path,
                        'file_type' => $media->file_type,
                    ]),
                    'hashtags' => $post->hashtags->map(fn ($tag) => [
                        'id' => $tag->id,
                        'hashtag' => $tag->hashtag,
                    ]),
                    'is_private' => $post->is_private,
                    'likes_count' => $post->likes->count(),
                    'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                    'favorites_count' => $post->favorites->count(),
                    'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                    'comments_count' => $post->comments->count(),
                    'is_reposted' => $currentUser ? $post->repostedByUsers->contains('id', $currentUser->id) : false,
                    'reposts_count' => $post->repostedByUsers->count(),
                ];
            });

        return Inertia::render('user/favorites', [
            'user' => $currentUser,
            'posts' => $favoritedPosts,
        ]);
    }

    public function liked(): Response
    {
        $currentUser = Auth::user();

        if (!$currentUser) {
            abort(403, 'Unauthorized');
        }

        $likedPosts = $currentUser->likes()
            ->with(['user.profileImage', 'comments', 'likes', 'media', 'user.followers'])
            ->where(function ($query) use ($currentUser) {
                $query->where('posts.is_private', 0)
                ->orWhere(function ($subQuery) use ($currentUser) {
                    $subQuery->where('posts.user_id', $currentUser->id)
                    ->orWhereHas('user.followers', function ($followersQuery) use ($currentUser) {
                        $followersQuery->where('follower_id', $currentUser->id);
                    });
                });
            })
            ->latest()
            ->get()
            ->filter(fn ($post) => $post->is_private == 0 || $post->user_id == $currentUser->id || $post->user->followers->contains('id', $currentUser->id))
            ->map(function ($post) use ($currentUser) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'created_at' => $post->created_at->format('n/j/Y'),
                    'user' => [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                        'username' => $post->user->username,
                        'profile_image_url' => $post->user->profileImage ? $post->user->profileImage->url : null,
                    ],
                    'media' => $post->media->map(fn ($media) => [
                        'file_path' => $media->file_path,
                        'file_type' => $media->file_type,
                    ]),
                    'hashtags' => $post->hashtags->map(fn ($tag) => [
                        'id' => $tag->id,
                        'hashtag' => $tag->hashtag,
                    ]),
                    'is_private' => $post->is_private,
                    'likes_count' => $post->likes->count(),
                    'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                    'favorites_count' => $post->favorites->count(),
                    'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                    'comments_count' => $post->comments->count(),
                    'is_reposted' => $currentUser ? $post->repostedByUsers->contains('id', $currentUser->id) : false,
                    'reposts_count' => $post->repostedByUsers->count(),
                ];
            });

        return Inertia::render('user/liked', [
            'user' => $currentUser,
            'posts' => $likedPosts,
        ]);
    }

    public function followingPosts(): Response
    {
        $currentUser = Auth::user();

        if (!$currentUser) {
            abort(403, 'Unauthorized');
        }

        $followingPosts = $currentUser->followingPosts()
            ->with(['user.profileImage', 'comments', 'likes', 'media'])
            ->latest()
            ->get()
            ->map(function ($post) use ($currentUser) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'created_at' => $post->created_at->format('n/j/Y'),
                    'user' => [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                        'username' => $post->user->username,
                        'profile_image_url' => $post->user->profileImage ? $post->user->profileImage->url : null,
                    ],
                    'media' => $post->media->map(fn ($media) => [
                        'file_path' => $media->file_path,
                        'file_type' => $media->file_type,
                    ]),
                    'hashtags' => $post->hashtags->map(fn ($tag) => [
                        'id' => $tag->id,
                        'hashtag' => $tag->hashtag,
                    ]),
                    'is_private' => $post->is_private,
                    'likes_count' => $post->likes->count(),
                    'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                    'favorites_count' => $post->favorites->count(),
                    'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                    'comments_count' => $post->comments->count(),
                    'is_reposted' => $currentUser ? $post->repostedByUsers->contains('id', $currentUser->id) : false,
                    'reposts_count' => $post->repostedByUsers->count(),
                ];
            });

        return Inertia::render('user/following-posts', [
            'user' => $currentUser,
            'posts' => $followingPosts,
        ]);
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);
        return Inertia::render('user/edit', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'bio' => $user->bio,
                'profile_image_url' => $user->profileImage ? $user->profileImage->url : null,
                'cover_image_url' => $user->coverImage ? $user->coverImage->url : null,
                'location' => $user->location,
                'website' => $user->website,
                'date_of_birth' => optional($user->date_of_birth)->format('F j, Y'),
                'is_verified' => $user->is_verified,
                'is_private' => $user->is_private,
                'status' => $user->status,
            ],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('update', $user);

        if ($request->hasFile('profile_image')) {
            if ($user->profileImage) {
                Storage::disk('public')->delete($user->profileImage->file_path);
                $user->profileImage()->delete();
            }

            $media = new Media([
                'file_path' => $request->file('profile_image')->store('profile_images', 'public'),
                'file_type' => 'profile',
                'mediable_id' => $user->id,
                'mediable_type' => User::class,
            ]);

            $media->save();
        }
        if ($request->hasFile('cover_image')) {
            if ($user->coverImage) {
                Storage::disk('public')->delete($user->coverImage->file_path);
                $user->coverImage()->delete();
            }

            $media = new Media([
                'file_path' => $request->file('cover_image')->store('cover_images', 'public'),
                'file_type' => 'cover',
                'mediable_id' => $user->id,
                'mediable_type' => User::class,
            ]);

            $media->save();
        }

        $user->update($request->validated());

        return redirect()->route('user.show', $user->username)
            ->with('success', 'Profile updated successfully.');
    }

    public function friends(User $user): Response
    {
        $friends = $user->friends()
            ->with('profileImage')
            ->select('id', 'name', 'username')
            ->get()
            ->map(function ($friend) {
                return [
                    'id' => $friend->id,
                    'name' => $friend->name,
                    'username' => $friend->username,
                    'profile_image_url' => $friend->profileImage ? $friend->profileImage->url : null,
                ];
            });

        return Inertia::render('user/friends', [
            'title' => 'Friends',
            'users' => $friends,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
            ],
        ]);
    }

}
