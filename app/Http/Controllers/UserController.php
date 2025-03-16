<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display the specified user's profile.
     */
    public function show(User $user = null): Response
    {
        $user = $user ?? Auth::user();

        if (!$user) {
            abort(404, 'User not found');
        }

        $user->loadCount(['followers', 'following']);

        $isFollowing = false;
        if (Auth::check() && Auth::id() !== $user->id) {
            $isFollowing = $user->followers()->where('follower_id', Auth::id())->exists();
        }

        return Inertia::render('user/show', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'name' => $user->name,
                'bio' => $user->bio,
                'profile_image_url' => $user->profile_image_url,
                'cover_image_url' => $user->cover_image_url,
                'location' => $user->location,
                'website' => $user->website,
                'date_of_birth' => $user->date_of_birth ? Carbon::parse($user->date_of_birth)->format('F j, Y') : null,
                'is_verified' => $user->is_verified,
                'is_private' => $user->is_private,
                'status' => $user->status,
                'created_at' => $user->created_at,
                'followers_count' => $user->followers_count,
                'following_count' => $user->following_count,
                'is_following' => $isFollowing,
            ]
        ]);
    }

    public function index(): Response
    {
        $users = User::select('id', 'name', 'username', 'profile_image_url')->get();

        return Inertia::render('dashboard', [
            'users' => $users,
        ]);
    }
}
