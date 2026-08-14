<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class UserSocialController extends Controller
{
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
                    $usersQuery->whereHas('followers', fn ($query) => $query->where('follower_id', $currentUser->id));
                }
                break;
            case 'followers':
                if ($currentUser) {
                    $usersQuery->whereHas('following', fn ($query) => $query->where('followee_id', $currentUser->id));
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
                'profile_image' => $user->profileImage,
                'followers_count' => $user->followers_count,
                'is_verified' => $user->is_verified,
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
                    $usersQuery->whereHas('followers', fn ($query) => $query->where('follower_id', $currentUser->id));
                }
                break;
            case 'followers':
                if ($currentUser) {
                    $usersQuery->whereHas('following', fn ($query) => $query->where('followee_id', $currentUser->id));
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
                'profile_image' => $user->profileImage,
                'followers_count' => $user->followers_count,
                'is_verified' => $user->is_verified,
            ];
        });

        return Inertia::render('user/search-users', [
            'users' => $users,
            'sort' => $sort,
            'searchText' => $searchText,
        ]);
    }

    public function searchEmpty(Request $request): Response
    {
        return Inertia::render('user/search-users', [
            'users' => [],
            'sort' => 'oldest',
            'searchText' => '',
        ]);
    }

    public function usersList(Request $request): Collection
    {
        $authUser = $request->user();

        $excludedUserIds = collect([
            $authUser->following()->pluck('users.id'),
            [$authUser->id],
        ])->flatten();

        $users = User::with('profileImage')
            ->withCount('followers')
            ->whereNotIn('id', $excludedUserIds)
            ->orderByDesc('followers_count')
            ->take(5)
            ->get();

        return $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'profile_image' => $user->profileImage,
                'followers_count' => $user->followers_count,
                'is_verified' => $user->is_verified,
            ];
        });
    }

    public function friends(Request $request): Response
    {
        $currentUser = Auth::user();

        $sort = $request->input('sort', 'latest');

        $friendsQuery = $currentUser->friends()
            ->with(['profileImage', 'followers'])
            ->withCount('followers');

        switch ($sort) {
            case 'latest':
                $friendsQuery->orderBy('pivot_created_at', 'desc');
                break;

            case 'oldest':
                $friendsQuery->orderBy('pivot_created_at', 'asc');
                break;

            case 'popular':
                $friendsQuery->orderByDesc('followers_count');
                break;
            case 'least_followers':
                $friendsQuery->orderBy('followers_count');
                break;
        }

        $friends = $friendsQuery->get();

        $mappedFriends = $friends->map(function ($friend) use ($currentUser) {
            return [
                'id' => $friend->id,
                'name' => $friend->name,
                'username' => $friend->username,
                'profile_image' => $friend->profileImage,
                'is_private' => $friend->is_private,
                'is_followed' => $currentUser?->following->contains('id', $friend->id) ?? false,
                'has_sent_follow_request' => $currentUser?->pendingFollowRequests()->where('followee_id', $friend->id)->exists() ?? false,
                'followers_count' => $friend->followers->count(),
                'is_friend' => $currentUser?->friends()->pluck('users.id')->contains($friend->id) ?? false,
                'is_verified' => $friend->is_verified,
            ];
        });

        return Inertia::render('user/friends', [
            'title' => 'Friends',
            'users' => $mappedFriends,
            'filters' => ['sort' => $sort],
            'user' => [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'username' => $currentUser->username,
                'is_verified' => $currentUser->is_verified,
                'profile_image' => $currentUser->profileImage,
                'is_following' => $currentUser?->followers()->where('follower_id', $currentUser->id)->exists() ?? false,
                'has_sent_follow_request' => $currentUser?->pendingFollowRequests()->where('followee_id', $currentUser->id)->exists() ?? false,
            ],
        ]);
    }
}
