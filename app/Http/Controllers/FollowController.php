<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
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
    use AuthorizesRequests;
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
            'is_accepted' => !$user->is_private,
        ]);

        NotificationService::create([
            'user_id' => $followeeId,
            'source_user_id' => $followerId,
            'type' => 'follow',
        ]);

        return back()->with('success', 'Followed successfully.');
    }

    public function unfollow(User $user): RedirectResponse
    {
        $followerId = Auth::id();
        $followeeId = $user->id;

        $deleted = Follow::where('follower_id', $followerId)
            ->where('followee_id', $followeeId)
            ->delete();

        if ($deleted) {
            Notification::where('type', 'follow')
                ->where('source_user_id', $followerId)
                ->where('user_id', $followeeId)
                ->delete();

            return back()->with('success', 'Unfollowed successfully.');
        }

        return back()->with('error', 'You are not following this user.');
    }

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
        $authUser = Auth::user();

        $followers = $user->followers()
            ->wherePivot('is_accepted', true)
            ->with('profileImage')
            ->withCount('followers')
            ->get()
            ->map(function ($follower) use ($authUser) {
                return [
                    'id' => $follower->id,
                    'name' => $follower->name,
                    'username' => $follower->username,
                    'profile_image_url' => $follower->profileImage ? $follower->profileImage->url : null,
                    'followers_count' => $follower->followers_count,
                    'is_followed' => $authUser->following->contains($follower->id),
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
        $authUser = Auth::user();

        $following = $user->following()
            ->wherePivot('is_accepted', true)
            ->with('profileImage')
            ->withCount('followers')
            ->get()
            ->map(function ($followingUser) use ($authUser) {
                return [
                    'id' => $followingUser->id,
                    'name' => $followingUser->name,
                    'username' => $followingUser->username,
                    'profile_image_url' => $followingUser->profileImage ? $followingUser->profileImage->url : null,
                    'followers_count' => $followingUser->followers_count,
                    'is_followed' => $authUser->following->contains($followingUser->id),
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

    public function acceptRequest(Follow $follow)
    {
        $this->authorize('accept', $follow);

        $follow->is_accepted = true;
        $follow->save();

        return back()->with('success', 'Follow request accepted.');
    }

    public function rejectRequest(Follow $follow)
    {
        $this->authorize('reject', $follow);

        $follow->delete();

        return back()->with('success', 'Follow request rejected.');
    }

    public function followRequests()
    {
        $user = Auth::user();

        $requests = Follow::with('follower.profileImage')
            ->where('followee_id', $user->id)
            ->where('is_accepted', false)
            ->get();

        return Inertia::render('user/follow-requests', [
            'requests' => $requests,
        ]);
    }

    public function sendFollowRequest(User $user)
    {
        $authUser = auth()->user();

        if ($user->id === $authUser->id) {
            return back()->with('error', 'You cannot follow yourself.');
        }

        if ($authUser->pendingFollowRequests()->where('target_user_id', $user->id)->exists()) {
            return back()->with('error', 'Request already sent.');
        }

        Notification::create([
            'type' => 'follow_request',
            'user_id' => $user->id,
            'source_user_id' => $authUser->id,
            'is_read' => false,
        ]);

        return back()->with('success', 'Follow request sent.');
    }



}
