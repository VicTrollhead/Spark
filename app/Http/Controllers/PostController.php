<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
    public function index(): Response
    {
        return Inertia::render('Posts/Index', [
            'posts' => Post::with(['user', 'parentPost', 'likes', 'comments'])->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Posts/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePostRequest $request)
    {
        $request->validated();

        $post = Post::create([
            'user_id' => Auth::id(),
            'content' => $request->content_,
            'parent_post_id' => $request->parent_post_id,
//            'post_type' => $request->post_type,
            'is_public' => $request->is_public,
        ]);

        return redirect()->route('dashboard')->with('success', 'Post created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post)
    {
        $currentUser = Auth::user();

        $post->load(['user', 'likes']);

        $comments = $post->comments()
            ->with('user')
            ->latest()
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at->format('n/j/Y'),
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
                'created_at' => $post->created_at->format('n/j/Y'),
                'user' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'username' => $post->user->username,
                    'profile_image_url' => $post->user->profile_image_url,
                ],
                'likes_count' => $post->likes->count(),
                'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
                'comments_count' => $comments->count(),
                'comments' => $comments,
            ]
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
            'post_type' => ['required', 'string'],
            'is_public' => ['required', 'boolean'],
        ]);

        $post->update($validated);

        return Redirect::route('posts.index')->with('success', 'Post updated successfully.');
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

        return Redirect::back()->with(['message' => 'Post deleted successfully']);
    }
}
