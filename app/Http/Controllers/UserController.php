<?php

namespace App\Http\Controllers;

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
            ->map(function ($post) use ($currentUser) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'created_at' => $post->created_at->format('n/j/Y'),
                    'user' => $post->user,
                    'likes_count' => $post->likes->count(),
                    'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
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



    /**
     * Display a list of users.
     */
    public function index(): Response
    {
        $users = User::select('id', 'name', 'username', 'profile_image_url')->get();

        return Inertia::render('dashboard', [
            'users' => $users,
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
     * Update the user profile.
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'bio' => ['nullable', 'string', 'max:500'],
            'location' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'profile_image' => ['nullable', 'image', 'mimes:jpg,png,jpeg,gif', 'max:2048'],
            'cover_image' => ['nullable', 'image', 'mimes:jpg,png,jpeg,gif', 'max:4096'],
            'is_private' => ['required', 'boolean'],
            'status' => ['required', Rule::in(['active', 'suspended', 'deactivated'])],
        ]);

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image_url) {
                Storage::delete($user->profile_image_url);
            }
            $validated['profile_image_url'] = $request->file('profile_image')->store('profiles');
        }

        if ($request->hasFile('cover_image')) {
            if ($user->cover_image_url) {
                Storage::delete($user->cover_image_url);
            }
            $validated['cover_image_url'] = $request->file('cover_image')->store('covers');
        }

        $user->update($validated);


        return redirect()->route('user.show', $user->username)->with('success', 'Profile updated successfully.');
    }
}
