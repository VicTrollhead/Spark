<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Hashtag;
use App\Models\Media;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request): Response
    {
        $currentUser = Auth::user();
        $sort = $request->query('sort', 'latest');

        $postsQuery = Post::with([
            'user.profileImage',
            'comments',
            'likes',
            'media',
            'hashtags',
            'favorites',
            'repostedByUsers',

        ])
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

            case 'followees':
                if ($currentUser) {
                    $postsQuery->whereHas('user.followers', function ($query) use ($currentUser) {
                        $query->where('follower_id', $currentUser->id);
                    });
                }
                break;

            case 'followers':
                if ($currentUser) {
                    $postsQuery->whereHas('user.following', function ($query) use ($currentUser) {
                        $query->where('followee_id', $currentUser->id);
                    });
                }
                break;

            case 'mutuals':
                if ($currentUser) {
                    $postsQuery->whereHas('user.followers', function ($query) use ($currentUser) {
                        $query->where('follower_id', $currentUser->id);
                    })->whereHas('user.following', function ($query) use ($currentUser) {
                        $query->where('followee_id', $currentUser->id);
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
                    'profile_image_url' => $post->user->profileImage?->url,
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
                'reposts_count' => $post->repostedByUsers->count(),
                'is_reposted' => $currentUser ? $post->repostedByUsers->contains('id', $currentUser->id) : false,
                'reposted_by_you' => $currentUser && $post->repostedByUsers->contains('id', $currentUser->id),
                'reposted_by_user' => $post->repostedByUsers
                    ->firstWhere('id', '!=', $post->user_id && $post->user_id != $currentUser?->id),
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
                'is_reposted' => $currentUser ? $post->repostedByUsers->contains('id', $currentUser->id) : false,
                'reposts_count' => $post->repostedByUsers->count(),
                'reposted_by_you' => $currentUser && $post->repostedByUsers->contains('id', $currentUser->id),
                'reposted_by_user' => $post->repostedByUsers
                    ->firstWhere('id', '!=', $post->user_id && $post->user_id != $currentUser?->id),
            ],
            'sort' => $sort
        ]);
    }

    public function destroy($postId)
    {
        $currentUser = Auth::user();
        $post = Post::with(['media', 'likes', 'comments'])->findOrFail($postId);
        if ($currentUser->id !== $post->user_id) {
            abort(403, 'Unauthorized');
        }

        foreach ($post->media as $media) {
            if (Storage::exists($media->file_path)) {
                Storage::delete($media->file_path);
            }
            $media->delete();
        }

        $post->likes()->delete();
        $post->comments()->delete();
        $post->hashtags()->detach();
        $post->delete();

        return redirect()->route('dashboard')->with('success', 'Post updated successfully.');
    }


    public function popularHashtags(Request $request)
    {
        $hashtags = Hashtag::withCount('posts')
            ->orderByDesc('posts_count')
            ->take(5)
            ->get();

        return $hashtags->map(function ($hashtag) {
            return [
                'id' => $hashtag->id,
                'hashtag' => $hashtag->hashtag,
                'uses_count' => $hashtag->posts_count,
            ];
        });
    }

    public function postsByHashtag(string $hashtag): Response
    {
        $currentUser = Auth::user();

        if (!$currentUser) {
            abort(403, 'Unauthorized');
        }

        $hashtagModel = Hashtag::where('hashtag', $hashtag)
            ->withCount('posts')
            ->firstOrFail();

        $posts = Post::whereHas('hashtags', function ($query) use ($hashtag) {
            $query->where('hashtag', $hashtag);
        })
            ->with(['user.profileImage', 'comments', 'likes', 'media', 'hashtags', 'favorites'])
            ->latest()
            ->get()
            ->map(function ($post) use ($currentUser) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'created_at' => $post->created_at->format('n/j/Y'),
                    'user' => [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                        'username' => $post->user->username,
                        'profile_image_url' => $post->user->profileImage?->url,
                    ],
                    'media' => $post->media->map(fn ($media) => [
                        'file_path' => $media->file_path,
                        'file_type' => $media->file_type,
                    ]),
                    'hashtags' => $post->hashtags->map(fn ($tag) => [
                        'id' => $tag->id,
                        'hashtag' => $tag->hashtag,
                        'uses_count' => $tag->posts()->count(),
                    ]),
                    'is_private' => $post->is_private,
                    'likes_count' => $post->likes->count(),
                    'is_liked' => $post->likes->contains('user_id', $currentUser->id),
                    'favorites_count' => $post->favorites->count(),
                    'is_favorited' => $post->favorites->contains('user_id', $currentUser->id),
                    'comments_count' => $post->comments->count(),
                    'is_reposted' => $currentUser ? $post->repostedByUsers->contains('id', $currentUser->id) : false,
                    'reposts_count' => $post->repostedByUsers->count(),
                    'reposted_by_you' => $currentUser && $post->repostedByUsers->contains('id', $currentUser->id),
                    'reposted_by_user' => $post->repostedByUsers
                        ->firstWhere('id', '!=', $post->user_id && $post->user_id != $currentUser?->id),
                ];
            });

        return Inertia::render('post/posts-by-hashtag', [
            'user' => $currentUser,
            'posts' => $posts,
            'hashtag' => [
                'id' => $hashtagModel->id,
                'hashtag' => $hashtagModel->hashtag,
                'uses_count' => $hashtagModel->posts_count,
            ],
        ]);
    }


    public function edit(Post $post): Response
    {
        $this->authorize('update', $post);

        return Inertia::render('post/edit-post', [
            'post' => [
                'id' => $post->id,
                'content' => $post->content,
                'is_private' => $post->is_private,
                'media' => $post->media->map(fn ($media) => [
                    'file_path' => $media->file_path,
                    'file_type' => $media->file_type,
                ]),
                'hashtags' => $post->hashtags->map(fn ($tag) => [
                    'id' => $tag->id,
                    'hashtag' => $tag->hashtag,
                ]),
                'parent_post_id' => $post->parent_post_id,
            ],
        ]);
    }


    public function update(UpdatePostRequest $request, Post $post)
    {
        $this->authorize('update', $post);


        $post->update([
            'content' => $request->input('content', ''),
            'is_private' => $request->boolean('is_private'),
        ]);

        $removePaths = $request->input('remove_media', []);
        if (!empty($removePaths)) {
            $mediaToRemove = $post->media()->whereIn('file_path', (array) $removePaths)->get();

            foreach ($mediaToRemove as $media) {
                if (Storage::disk('public')->exists($media->file_path)) {
                    Storage::disk('public')->delete($media->file_path);
                }
                $media->delete();
            }
        }

        if ($request->hasFile('media')) {
            $files = $request->file('media');
            $files = is_array($files) ? $files : [$files];

            foreach ($files as $file) {
                $path = $file->store('uploads/posts', 'public');

                $post->media()->create([
                    'file_path' => $path,
                    'file_type' => str_contains($file->getMimeType(), 'video') ? 'video' : 'image',
                ]);
            }
        }

        if ($request->filled('hashtags')) {
            $hashtagIds = collect($request->hashtags)->map(function ($tag) {
                return \App\Models\Hashtag::firstOrCreate(['hashtag' => $tag])->id;
            });
            $post->hashtags()->sync($hashtagIds);
        } else {
            $post->hashtags()->sync([]);
        }

        return to_route('post.show', $post->id)->with('success', 'Post updated successfully.');
    }




}
