<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Models\Media;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    public function index(Request $request): Response
    {
        $currentUser = Auth::user();
        $sort = $request->query('sort', 'latest');

        $postsQuery = Post::with(['user.profileImage', 'comments', 'likes', 'media', 'hashtags'])
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



        switch ($sort) {
            case 'likes':
                $postsQuery->withCount('likes')->orderByDesc('likes_count');
                break;
            case 'oldest':
                $postsQuery->oldest();
                break;
            case 'friends':
                if ($currentUser) {
                    $postsQuery->whereHas('user.followers', function ($query) use ($currentUser) {
                        $query->where('follower_id', $currentUser->id);
                    });
                }
                break;
            default:
                $postsQuery->latest();
                break;
        }


        $posts = $postsQuery->get()->map(function ($post) use ($currentUser) {
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
                'hashtags' => $post->hashtags->map(fn ($tag) => [
                    'id' => $tag->id,
                    'hashtag' => $tag->hashtag,
                ]),
                'media' => $post->media->map(fn ($media) => [
                    'file_path' => $media->file_path,
                    'file_type' => $media->file_type,
                ]),
                'is_private' => $post->is_private,
                'likes_count' => $post->likes->count(),
                'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                'favorites_count' => $post->favorites->count(),
                'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                'comments_count' => $post->comments->count(),
            ];
        });

        return Inertia::render('dashboard', [
            'posts' => $posts,
            'sort' => $sort,
        ]);
    }

    public function store(StorePostRequest $request)
    {
        $validated = $request->validated();

        $post = Post::create([
            'user_id' => Auth::id(),
            'content' => $validated['content'],
            'parent_post_id' => $validated['parent_post_id'] ?? null,
            'is_private' => $validated['is_private'] ?? false,
        ]);

        if ($request->hasFile('media')) {
            foreach ($request->file('media') as $file) {
                $path = $file->store('uploads/posts', 'public');

                $media = new Media([
                    'file_path' => $path,
                    'file_type' => str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image',
                    'mediable_id' => $post->id,
                    'mediable_type' => Post::class,
                ]);

                $media->save();
            }
        }
        $hashtags = $validated['hashtags'] ?? [];
        $hashtagIds = [];

        foreach ($hashtags as $tag) {
            $cleanTag = ltrim($tag, '#');
            $hashtag = \App\Models\Hashtag::firstOrCreate([
                'hashtag' => strtolower($cleanTag)
            ]);

            $hashtagIds[] = $hashtag->id;
        }

        $post->hashtags()->sync($hashtagIds);

        return redirect()->route('dashboard')->with('success', 'Post created successfully!');
    }


    public function show(Post $post, Request $request)
    {
        $currentUser = Auth::user();

        if (Gate::denies('view', $post)) {
            abort(403, 'Unauthorized to view this post.');
        }

        $sort = $request->query('sort', 'latest');

        $post->load([
            'user.profileImage',
            'comments.user.profileImage',
            'likes',
            'media',
            'hashtags'
        ]);

        $hashtags = $post->hashtags->map(function ($hashtag) {
            return [
                'id' => $hashtag->id,
                'hashtag' => $hashtag->hashtag,
            ];
        });

        $commentsQuery = $post->comments()->with('user.profileImage');

        switch ($sort) {
            case 'likes':
                $commentsQuery->withCount('likes')->orderByDesc('likes_count');
                break;
            case 'oldest':
                $commentsQuery->oldest();
                break;
            default:
                $commentsQuery->latest();
                break;
        }

        $comments = $commentsQuery->get()->map(function ($comment) {
            return [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at->diffForHumans(),
                'user' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'username' => $comment->user->username,
                    'profile_image_url' => $comment->user->profileImage ? asset('storage/' . $comment->user->profileImage->file_path) : null,
                ],
            ];
        });

        return Inertia::render('post/show-post', [
            'post' => [
                'id' => $post->id,
                'content' => $post->content,
                'media' => $post->media->map(fn ($media) => [
                    'file_path' => $media->file_path,
                    'file_type' => $media->file_type,
                ]),
                'created_at' => $post->created_at->format('n/j/Y'),
                'user' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'username' => $post->user->username,
                    'profile_image_url' => $post->user->profileImage ? asset('storage/' . $post->user->profileImage->file_path) : null, // ✅ Fix profile image URL
                ],
                'is_private' => $post->is_private,
                'likes_count' => $post->likes->count(),
                'is_liked' => $currentUser ? $post->likes->contains('user_id', auth()->id()) : false,
                'favorites_count' => $post->favorites->count(),
                'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
                'comments_count' => $comments->count(),
                'comments' => $comments,
                'hashtags' => $hashtags,
            ],
            'sort' => $sort
        ]);
    }

    public function edit(Post $post): Response
    {
        return Inertia::render('Posts/Edit', [
            'post' => $post,
        ]);
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
            'is_private' => ['required', 'boolean'],
        ]);

        $post->update($validated);

        return redirect()->route('posts.index')->with('success', 'Post updated successfully.');
    }

    public function destroy(Post $post): RedirectResponse
    {
        if (Auth::id() !== $post->user_id) {
            return Redirect::back()->with(['error' => 'Unauthorized'], 403);
        }

        $post->update(['is_deleted' => true]);

        return redirect()->back()->with(['message' => 'Post deleted successfully']);
    }
}
