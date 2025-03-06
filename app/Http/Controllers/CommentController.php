<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Comment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class CommentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Comments/Index', [
            'comments' => Comment::with(['user', 'replies'])->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Comments/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'post_id' => ['required', Rule::exists('posts', 'id')],
            'content' => ['required', 'string'],
            'parent_comment_id' => ['nullable', Rule::exists('comments', 'id')],
        ]);

        Comment::create([
            'user_id' => Auth::id(),
            'post_id' => $validated['post_id'],
            'content' => $validated['content'],
            'parent_comment_id' => $validated['parent_comment_id'] ?? null,
        ]);

        return Redirect::route('comments.index')->with('success', 'Comment added successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Comment $comment): Response
    {
        return Inertia::render('Comments/Show', [
            'comment' => $comment->load(['user', 'replies']),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Comment $comment): Response
    {
        return Inertia::render('Comments/Edit', [
            'comment' => $comment,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Comment $comment): RedirectResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string'],
        ]);

        $comment->update($validated);

        return Redirect::route('comments.index')->with('success', 'Comment updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Comment $comment): RedirectResponse
    {
        $comment->delete();
        return Redirect::route('comments.index')->with('success', 'Comment deleted successfully.');
    }
}
