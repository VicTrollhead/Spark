<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Like;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class LikeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Likes/Index', [
            'likes' => Like::with(['user', 'post'])->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Likes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'post_id' => ['required', Rule::exists('posts', 'id')],
            'is_deleted' => ['boolean'],
        ]);

        Like::create([
            'user_id' => Auth::id(),
            'post_id' => $validated['post_id'],
            'is_deleted' => $validated['is_deleted'] ?? false,
        ]);

        return Redirect::route('likes.index')->with('success', 'Like added successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Like $like): Response
    {
        return Inertia::render('Likes/Show', [
            'like' => $like->load(['user', 'post']),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Like $like): Response
    {
        return Inertia::render('Likes/Edit', [
            'like' => $like,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Like $like): RedirectResponse
    {
        $validated = $request->validate([
            'is_deleted' => ['required', 'boolean'],
        ]);

        $like->update($validated);

        return Redirect::route('likes.index')->with('success', 'Like updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Like $like): RedirectResponse
    {
        $like->delete();
        return Redirect::route('likes.index')->with('success', 'Like deleted successfully.');
    }
}
