<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display the specified user's profile.
     */
    public function show(User $user = null): Response
    {
        $currentUser = Auth::user();
        $user = $user ?? $currentUser;

        if (!$user) {
            abort(404, 'User not found');
        }

        $canViewFullProfile = Gate::allows('view', $user);

        $user->loadCount(['followers', 'following']);

        $posts = $user->posts()
            ->with(['user', 'comments', 'likes'])
            ->latest()
            ->get()
            ->filter(fn ($post) => Gate::allows('view', $post))
            ->map(function ($post) use ($currentUser) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'created_at' => $post->created_at->format('n/j/Y'),
                    'media_url' => $post->media_url,
                    'is_private' => $post->is_private,
                    'user' => $post->user,
                    'likes_count' => $post->likes->count(),
                    'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                    'favorites_count' => $post->favorites->count(),
                    'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                    'comments_count' => $post->comments->count(),
                ];
            });

        return Inertia::render('user/show', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $canViewFullProfile ? $user->name : null,
                'bio' => $canViewFullProfile ? $user->bio : null,
                'profile_image_url' => $user->profile_image_url,
                'cover_image_url' => $canViewFullProfile ? $user->cover_image_url : null,
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
            'posts' => $posts
        ]);
    }

    public function index(): Response
    {
        $currentUser = Auth::user();

        $users = User::select('id', 'name', 'username', 'profile_image_url')->get();

        $posts = Post::with(['user', 'comments', 'likes'])
            ->latest()
            ->get()
            ->filter(fn ($post) => Gate::allows('view', $post))
            ->map(function ($post) use ($currentUser) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'created_at' => $post->created_at->format('n/j/Y'),
                    'user' => [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                        'username' => $post->user->username,
                        'profile_image_url' => $post->user->profile_image_url,
                    ],
                    'media_url' => $post->media_url,
                    'is_private' => $post->is_private,
                    'likes_count' => $post->likes->count(),
                    'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                    'favorites_count' => $post->favorites->count(),
                    'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                    'comments_count' => $post->comments->count(),
                ];
            });

        return Inertia::render('dashboard', [
            'users' => $users,
            'posts' => $posts,
        ]);
    }

    public function favorites(): Response
    {
        $currentUser = Auth::user();

        if (!$currentUser) {
            abort(403, 'Unauthorized');
        }

        $favoritedPosts = $currentUser->favorites()
            ->with(['user', 'comments', 'likes', 'favorites'])
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
                        'profile_image_url' => $post->user->profile_image_url,
                    ],
                    'media_url' => $post->media_url,
                    'is_private' => $post->is_private,
                    'likes_count' => $post->likes->count(),
                    'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                    'favorites_count' => $post->favorites->count(),
                    'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                    'comments_count' => $post->comments->count(),
                ];
            });

        return Inertia::render('user/favorites', [
            'user' => $currentUser,
            'posts' => $favoritedPosts,
        ]);
    }


    /**
     * Show the edit profile page.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);
        return Inertia::render('user/edit', [
            'user' => $user,
        ]);
    }

    /**
     * Display a list of users.
     */
    public function users(Request $request): Response
    {
        $currentUser = Auth::user();
        $sort = $request->query('sort', 'newest');

        $usersQuery = User::select('id', 'name', 'username', 'profile_image_url')
            ->withCount('followers');

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
                    $usersQuery->whereHas('followers', function ($query) use ($currentUser) {
                        $query->where('follower_id', $currentUser->id);
                    });
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

        $users = $usersQuery->get();

        return Inertia::render('user-dashboard', [
            'users' => $users,
            'sort' => $sort,
        ]);
    }



    /**
     * Update the user profile.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $user->update($request->validated());

        return redirect()->route('user.show', $user->username)
            ->with('success', 'Profile updated successfully.');
    }
}
