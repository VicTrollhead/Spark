<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Models\Media;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UserProfileController extends Controller
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
        $user->load(array_map(fn($rel) => "pinnedPost.$rel", Post::STANDARD_EAGER_LOADS));

        $originalPostsQuery = $user->posts()
            ->with(Post::STANDARD_EAGER_LOADS)
            ->visibleTo($currentUser);

        $repostedPostsQuery = Post::whereHas('repostedByUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(Post::STANDARD_EAGER_LOADS)
            ->visibleTo($currentUser);

        $repostTimes = \App\Models\Repost::where('user_id', $user->id)->pluck('created_at', 'post_id');

        if ($sort === 'reposts') {
            $originalPosts = collect();
            $repostedPosts = $repostedPostsQuery->get();
        } elseif ($sort === 'originals') {
            $originalPosts = $originalPostsQuery->latest()->get();
            $repostedPosts = collect();
        } else {
            $originalPosts = $originalPostsQuery->get();
            $repostedPosts = $repostedPostsQuery->get();
        }

        $repostedPosts->each(function ($post) use ($repostTimes) {
            $post->reposted_at = $repostTimes[$post->id] ?? $post->created_at;
        });

        $combinedPosts = $originalPosts->merge($repostedPosts);

        if ($sort === 'most_liked') {
            $combinedPosts = $combinedPosts->sortByDesc(fn($post) => $post->likes->count())->values();
        } elseif ($sort === 'oldest') {
            $combinedPosts = $combinedPosts->sortBy(fn($post) => $post->reposted_at ?? $post->created_at)->values();
        } else {
            $combinedPosts = $combinedPosts->sortByDesc(fn($post) => $post->reposted_at ?? $post->created_at)->values();
        }

        $repostedPostIds = $user->repostedPosts()->pluck('posts.id');

        $totalLikes = $user->posts()
            ->whereNotIn('id', $repostedPostIds)
            ->withCount('likes')
            ->get()
            ->sum('likes_count');

        $postsCount = $user->posts()->count();
        $badges = [];

        if ($postsCount >= 1) $badges[] = ['key' => 'first_post', 'label' => 'First Post', 'icon' => 'pencil'];
        if ($postsCount >= 10) $badges[] = ['key' => 'active_poster', 'label' => 'Active Poster', 'icon' => 'flame'];
        if ($postsCount >= 100) $badges[] = ['key' => 'prolific', 'label' => 'Prolific', 'icon' => 'trophy'];
        if ($user->followers_count >= 10) $badges[] = ['key' => 'rising_star', 'label' => 'Rising Star', 'icon' => 'star'];
        if ($user->followers_count >= 100) $badges[] = ['key' => 'popular', 'label' => 'Popular', 'icon' => 'trending-up'];
        if ($user->followers_count >= 1000) $badges[] = ['key' => 'influencer', 'label' => 'Influencer', 'icon' => 'crown'];
        if ($totalLikes >= 50) $badges[] = ['key' => 'liked', 'label' => 'Well Liked', 'icon' => 'heart'];
        if ($totalLikes >= 500) $badges[] = ['key' => 'beloved', 'label' => 'Beloved', 'icon' => 'sparkles'];
        if ($user->created_at->diffInDays(now()) >= 365) $badges[] = ['key' => 'veteran', 'label' => 'Veteran', 'icon' => 'shield'];

        $page = $request->input('page', 1);
        $perPage = 15;
        $posts = new LengthAwarePaginator(
            $combinedPosts->forPage($page, $perPage)->values()->map(fn($post) => formatPostForFrontend($post, $currentUser)),
            $combinedPosts->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('user/show', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'bio' => $canViewFullProfile ? $user->bio : null,
                'profile_image' => $user->profileImage,
                'cover_image' => $canViewFullProfile && $user->coverImage ? $user->coverImage : null,
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
                'is_friend' => Auth::check() && Auth::user()->friends()->where('followee_id', $user->id)->exists(),
                'canViewFullProfile' => $canViewFullProfile,
                'has_sent_follow_request' => Auth::check() && auth()->user()->pendingFollowRequests()
                        ->where('followee_id', $user->id)
                        ->exists(),
                'total_likes' => $totalLikes,
            ],
            'posts' => $posts,
            'filters' => [
                'sort' => $sort,
            ],
            'pinned_post' => $user->pinnedPost ? formatPostForFrontend($user->pinnedPost, $currentUser) : null,
            'badges' => $canViewFullProfile ? $badges : [],
            'followers_string' => trans_choice('common.followers_count', $user->followers_count),
            'following_string' => trans_choice('common.following_count', $user->following_count),
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
                'profile_image' => $user->profileImage,
                'cover_image' => $user->coverImage,
                'location' => $user->location,
                'website' => $user->website,
                'date_of_birth' => optional($user->date_of_birth)->format('F j, Y'),
                'is_verified' => $user->is_verified,
                'is_private' => $user->is_private,
                'status' => $user->status,
            ],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        DB::transaction(function () use ($request, $user) {
            $disk = config('filesystems.default');

            if ($request->hasFile('profile_image')) {
                if ($user->profileImage) {
                    Storage::disk($disk)->delete($user->profileImage->file_path);
                    $user->profileImage()->delete();
                }
                $path = $request->file('profile_image')->store('profile_images', $disk);

                $media = new Media([
                    'file_path' => $path,
                    'file_type' => 'profile',
                    'disk' => $disk,
                    'mediable_id' => $user->id,
                    'mediable_type' => User::class,
                ]);

                $media->save();
            }
            elseif ($request->boolean('remove_profile_image') && $user->profileImage) {
                Storage::disk($disk)->delete($user->profileImage->file_path);
                $user->profileImage()->delete();
            }

            if ($request->hasFile('cover_image')) {
                if ($user->coverImage) {
                    Storage::disk($disk)->delete($user->coverImage->file_path);
                    $user->coverImage()->delete();
                }

                $path = $request->file('cover_image')->store('cover_images', $disk);

                $media = new Media([
                    'file_path' => $path,
                    'file_type' => 'cover',
                    'disk' => $disk,
                    'mediable_id' => $user->id,
                    'mediable_type' => User::class,
                ]);

                $media->save();
            }
            elseif ($request->boolean('remove_cover_image') && $user->coverImage) {
                Storage::disk($disk)->delete($user->coverImage->file_path);
                $user->coverImage()->delete();
            }

            $user->update($request->validated());
        });

        return redirect()->route('user.show', $user->username)
            ->with('success', 'Profile updated successfully.');
    }
}
