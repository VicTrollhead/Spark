<?php

namespace App\Http\Controllers;

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
            'posts' => Post::with(['user', 'parentPost', 'replies', 'likes', 'comments'])->get(),
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
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
            'parent_post_id' => ['nullable', Rule::exists('posts', 'id')],
            'post_type' => ['required', 'string'],
            'is_public' => ['required', 'boolean'],
        ]);

        Post::create([
            'user_id' => Auth::id(),
            'content' => $validated['content'],
            'parent_post_id' => $validated['parent_post_id'] ?? null,
            'post_type' => $validated['post_type'],
            'is_deleted' => false,
            'is_public' => $validated['is_public'],
        ]);

        return Redirect::route('posts.index')->with('success', 'Post created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post): Response
    {
        return Inertia::render('Posts/Show', [
            'post' => $post->load(['user', 'parentPost', 'replies', 'likes', 'comments']),
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
        $post->update(['is_deleted' => true]);
        return Redirect::route('posts.index')->with('success', 'Post deleted successfully.');
    }
}
