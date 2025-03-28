<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
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
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $currentUser = Auth::user();
        $sort = $request->query('sort', 'latest');

        $postsQuery = Post::with(['user', 'comments', 'likes'])
            ->where(function ($query) use ($currentUser) {
                $query->where('is_private', false);

                if ($currentUser) {
                    $query->orWhereHas('user.followers', function ($subQuery) use ($currentUser) {
                        $subQuery->where('follower_id', $currentUser->id);
                    });

                    $query->orWhere('user_id', $currentUser->id);
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
                    'profile_image_url' => $post->user->profile_image_url,
                ],
                'media_url' => $post->media_url,
                'is_private' => $post->is_private,
                'likes_count' => $post->likes->count(),
                'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                'comments_count' => $post->comments->count(),
            ];
        });

        return Inertia::render('dashboard', [
            'posts' => $posts,
            'sort' => $sort,
        ]);
    }



    /**
     * Show the form for creating a new resource.
     */
//    public function create(): Response
//    {
//        return Inertia::render('Posts/Create');
//    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePostRequest $request)
    {
        $request->validated();

        Post::create([
            'user_id' => Auth::id(),
            'content' => $request['content'],
            'parent_post_id' => $request['parent_post_id'],
            'media_url' => $request['media_url'],
            'is_private' => $request['is_private'],
        ]);

        return redirect()->route('dashboard')->with('success', 'Post created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post, Request $request)
    {
        if (Gate::denies('view', $post)) {
            abort(403, 'Unauthorized to view this post.');
        }

        $sort = $request->query('sort', 'latest');

        $post->load(['user', 'comments', 'likes']);

        $commentsQuery = $post->comments()->with('user');

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
                    'profile_image_url' => $comment->user->profile_image_url,
                ],
            ];
        });

        return Inertia::render('post/show-post', [
            'post' => [
                'id' => $post->id,
                'content' => $post->content,
                'media_url' => $post->media_url,
                'created_at' => $post->created_at->format('n/j/Y'),
                'user' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'username' => $post->user->username,
                    'profile_image_url' => $post->user->profile_image_url,
                ],
                'is_private' => $post->is_private,
                'likes_count' => $post->likes->count(),
                'is_liked' => auth()->check() ? $post->likes->contains('user_id', auth()->id()) : false,
                'comments_count' => $comments->count(),
                'comments' => $comments,
            ],
            'sort' => $sort
        ]);
    }



    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Post $post): Response
    {
        return Inertia::render('Posts/Edit', [
            'post' => $post,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Post $post): RedirectResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
            'is_private' => ['required', 'boolean'],
        ]);

        $post->update($validated);

        return redirect()->route('posts.index')->with('success', 'Post updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post): RedirectResponse
    {
        if (Auth::id() !== $post->user_id) {
            return Redirect::back()->with(['error' => 'Unauthorized'], 403);
        }

        $post->update(['is_deleted' => true]);

        return redirect()->back()->with(['message' => 'Post deleted successfully']);
    }
}
