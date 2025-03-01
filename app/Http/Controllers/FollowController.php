<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Follow;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;

class FollowController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Follows/Index', [
            'follows' => Follow::with(['follower', 'followee'])->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Follows/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'followee_id' => 'required|exists:users,id|not_in:' . Auth::id(),
            'is_accepted' => 'boolean'
        ]);

        Follow::create([
            'follower_id' => Auth::id(),
            'followee_id' => $validated['followee_id'],
            'is_accepted' => $validated['is_accepted'] ?? false,
        ]);

        return Redirect::route('follows.index')->with('success', 'Подписка отправлена.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Follow $follow): Response
    {
        return Inertia::render('Follows/Show', [
            'follow' => $follow->load(['follower', 'followee'])
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Follow $follow): Response
    {
        return Inertia::render('Follows/Edit', [
            'follow' => $follow
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Follow $follow): RedirectResponse
    {
        $validated = $request->validate([
            'is_accepted' => 'required|boolean'
        ]);

        $follow->update($validated);

        return Redirect::route('follows.index')->with('success', 'Статус подписки обновлён.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Follow $follow): RedirectResponse
    {
        $follow->delete();
        return Redirect::route('follows.index')->with('success', 'Подписка удалена.');
    }
}
