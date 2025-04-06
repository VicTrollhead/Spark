<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Follow;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class FollowController extends Controller
{
    /**
     * Follow a user.
     */
    public function follow(User $user): RedirectResponse
    {
        $followerId = Auth::id();
        $followeeId = $user->id;

        if ($followerId === $followeeId) {
            return back()->with('error', 'You cannot follow yourself.');
        }

        $alreadyFollowing = Follow::where('follower_id', $followerId)
            ->where('followee_id', $followeeId)
            ->exists();

        if ($alreadyFollowing) {
            return back()->with('error', 'Already following this user.');
        }

        Follow::create([
            'follower_id' => $followerId,
            'followee_id' => $followeeId,
        ]);

        return back()->with('success', 'Followed successfully.');
    }

    /**
     * Unfollow a user.
     */
    public function unfollow(User $user): RedirectResponse
    {
        $followerId = Auth::id();
        $followeeId = $user->id;

        $deleted = Follow::where('follower_id', $followerId)
            ->where('followee_id', $followeeId)
            ->delete();

        if ($deleted) {
            return back()->with('success', 'Unfollowed successfully.');
        }

        return back()->with('error', 'You are not following this user.');
    }

    /**
     * Check if the authenticated user is following another user.
     */
    public function isFollowing(User $user)
    {
        $followerId = Auth::id();
        $followeeId = $user->id;

        $isFollowing = Follow::where('follower_id', $followerId)
            ->where('followee_id', $followeeId)
            ->exists();

        return response()->json(['following' => $isFollowing]);
    }

    public function followers(User $user)
    {
        $followers = $user->followers()
            ->with('profileImage')
            ->withCount('followers')
            ->get()
            ->map(function ($follower) {
                return [
                    'id' => $follower->id,
                    'name' => $follower->name,
                    'username' => $follower->username,
                    'profile_image_url' => $follower->profileImage ? $follower->profileImage->url : null,
                    'followers_count' => $follower->followers_count,
                ];
            });

        return inertia('user/followers', [
            'title' => 'Followers',
            'users' => $followers,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'profile_image_url' => $user->profileImage ? $user->profileImage->url : null,
            ],
        ]);
    }

    public function following(User $user)
    {
        $following = $user->following()
            ->with('profileImage')
            ->withCount('followers')
            ->get()
            ->map(function ($followingUser) {
                return [
                    'id' => $followingUser->id,
                    'name' => $followingUser->name,
                    'username' => $followingUser->username,
                    'profile_image_url' => $followingUser->profileImage ? $followingUser->profileImage->url : null,
                    'followers_count' => $followingUser->followers_count,
                ];
            });

        return inertia('user/following', [
            'title' => 'Following',
            'users' => $following,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'profile_image_url' => $user->profileImage ? $user->profileImage->url : null,
            ],
        ]);
    }

    public function friends(User $user)
    {
        $friends = $user->friends()->select('id', 'name', 'username', 'profile_image_url')->get();
        return inertia('user/friends', ['title' => 'Friends', 'users' => $friends, 'user' => $user]);
    }
}
