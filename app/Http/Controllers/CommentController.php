<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Models\Post;
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
    public function store(StoreCommentRequest $request, Post $post): RedirectResponse
    {
        $request->validated();

        Comment::create([
            'user_id' => Auth::id(),
            'post_id' => $request['post_id'],
            'parent_comment_id' =>  $request['parent_comment_id'],
            'content' => $request['content'],
        ]);

        return redirect()->back()->with('success', 'Comment added successfully.');
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

        return redirect()->route('comments.index')->with('success', 'Comment updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Comment $comment): RedirectResponse
    {
        if (Auth::id() !== $comment->user_id) {
            return Redirect::back()->with(['error' => 'Unauthorized'], 403);
        }
        $comment->delete();
        return redirect()->back()->with(['message' => 'Comment deleted successfully']);
    }
}
