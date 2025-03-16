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
        $followers = $user->followers()->select('id', 'name', 'username', 'profile_image_url as avatar')->get();
        return inertia('user/followers', ['title' => 'Followers', 'users' => $followers]);
    }

    public function following(User $user)
    {
        $following = $user->following()->select('id', 'name', 'username', 'profile_image_url as avatar')->get();
        return inertia('user/following', ['title' => 'Following', 'users' => $following]);
    }

}
