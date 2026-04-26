<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\PostCreated;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Comment;
use App\Models\Media;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Post;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;

class PostController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request): Response
    {
        $currentUser = Auth::user();
        $sort = $request->query('sort', 'latest');

        $postsQuery = postBaseQuery($currentUser);

        switch ($sort) {
            case 'likes':
                $postsQuery->withCount('likes')->orderByDesc('likes_count');
                break;

            case 'comments':
                $postsQuery->withCount('comments')->orderByDesc('comments_count');
                break;

            case 'reposts':
                $postsQuery->withCount('repostedByUsers')->orderByDesc('reposted_by_users_count');
                break;

            case 'favorites':
                $postsQuery->withCount('favorites')->orderByDesc('favorites_count');
                break;

            case 'most_activity':
                $postsQuery->withCount(['likes', 'comments', 'favorites', 'repostedByUsers'])
                    ->orderByDesc(DB::raw('(likes_count + comments_count + favorites_count + reposted_by_users_count)'));
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


        $posts = $postsQuery->paginate(15)->through(fn($post) => formatPostForFrontend($post, $currentUser));

        $quotePost = null;
        if ($quoteSlug = $request->query('quote')) {
            $quotePostModel = Post::with(['user.profileImage', 'media'])->where('slug', $quoteSlug)->first();
            if ($quotePostModel) {
                $quotePost = [
                    'id' => $quotePostModel->id,
                    'slug' => $quotePostModel->slug,
                    'content' => $quotePostModel->content,
                    'created_at' => $quotePostModel->created_at->format('n/j/Y'),
                    'user' => [
                        'id' => $quotePostModel->user->id,
                        'name' => $quotePostModel->user->name,
                        'username' => $quotePostModel->user->username,
                        'profile_image' => $quotePostModel->user->profileImage,
                        'is_verified' => $quotePostModel->user->is_verified,
                    ],
                ];
            }
        }

        $replyPost = null;
        if ($replySlug = $request->query('reply')) {
            $replyPostModel = Post::with(['user.profileImage', 'media'])->where('slug', $replySlug)->first();
            if ($replyPostModel) {
                $replyPost = [
                    'id' => $replyPostModel->id,
                    'slug' => $replyPostModel->slug,
                    'content' => mb_substr($replyPostModel->content, 0, 120),
                    'created_at' => $replyPostModel->created_at->format('n/j/Y'),
                    'user' => [
                        'id' => $replyPostModel->user->id,
                        'name' => $replyPostModel->user->name,
                        'username' => $replyPostModel->user->username,
                        'profile_image' => $replyPostModel->user->profileImage,
                        'is_verified' => $replyPostModel->user->is_verified,
                    ],
                ];
            }
        }

        return Inertia::render('dashboard', [
            'posts' => $posts,
            'sort' => $sort,
            'quote_post' => $quotePost,
            'reply_post' => $replyPost,
        ]);
    }


    public function store(StorePostRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Ensure the user can view the quoted post
        if (!empty($validated['quote_post_id'])) {
            $quotedPost = Post::findOrFail($validated['quote_post_id']);
            if (Gate::denies('view', $quotedPost)) {
                abort(403, 'You cannot quote this post.');
            }
        }

        $mediaUrls = DB::transaction(function () use ($request, $validated) {
            $post = Post::create([
                'user_id' => Auth::id(),
                'content' => $validated['content'],
                'parent_post_id' => $validated['parent_post_id'] ?? null,
                'quote_post_id' => $validated['quote_post_id'] ?? null,
                'is_private' => $validated['is_private'] ?? false,
            ]);

            $mediaUrls = [];

            if ($request->hasFile('media')) {
                $disk = config('filesystems.default');

                foreach ($request->file('media') as $file) {
                    $path = $file->store('uploads/posts', $disk);

                    $media = new Media([
                        'file_path' => $path,
                        'file_type' => str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image',
                        'disk' => $disk,
                        'mediable_id' => $post->id,
                        'mediable_type' => Post::class,
                    ]);

                    $media->save();
                    $mediaUrls[] = $media->url;
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

            if (!empty($validated['poll_options'])) {
                $expiresAt = !empty($validated['poll_expires_in'])
                    ? now()->addMinutes($validated['poll_expires_in'])
                    : null;

                $poll = $post->poll()->create(['expires_at' => $expiresAt]);

                foreach ($validated['poll_options'] as $optionText) {
                    if (trim($optionText) !== '') {
                        $poll->options()->create(['text' => trim($optionText)]);
                    }
                }
            }

            return ['mediaUrls' => $mediaUrls, 'post' => $post];
        });

        if (!empty($validated['content'])) {
            notifyMentionedUsers($validated['content'], Auth::id(), $mediaUrls['post']->id);
        }

        $createdPost = $mediaUrls['post'];

        // Notify parent post author when someone replies
        if (!empty($validated['parent_post_id'])) {
            $parentPost = Post::find($validated['parent_post_id']);
            if ($parentPost && $parentPost->user_id !== Auth::id()) {
                NotificationService::create([
                    'user_id' => $parentPost->user_id,
                    'source_user_id' => Auth::id(),
                    'type' => 'reply',
                    'post_id' => $createdPost->id,
                    'extra_data' => \Illuminate\Support\Str::limit($validated['content'], 120),
                ]);
            }
        }

        // Notify quoted post author when someone quotes their post
        if (!empty($validated['quote_post_id'])) {
            $quotedPost = Post::find($validated['quote_post_id']);
            if ($quotedPost && $quotedPost->user_id !== Auth::id()) {
                NotificationService::create([
                    'user_id' => $quotedPost->user_id,
                    'source_user_id' => Auth::id(),
                    'type' => 'quote',
                    'post_id' => $createdPost->id,
                    'extra_data' => \Illuminate\Support\Str::limit($validated['content'], 120),
                ]);
            }
        }

        // Broadcast new post to followers' feeds
        $post = $mediaUrls['post'];
        $post->load(Post::STANDARD_EAGER_LOADS);
        $currentUser = Auth::user();
        $formattedPost = formatPostForFrontend($post, null);

        $followerIds = $currentUser->followers()->pluck('users.id')->toArray();
        // Include the author so their other tabs/devices also see it
        $followerIds[] = $currentUser->id;

        if (!empty($followerIds)) {
            broadcast(new PostCreated($formattedPost, $followerIds))->toOthers();
        }

        return redirect()->route('dashboard')->with('success', 'Post created successfully!')->with('mediaUrls', $mediaUrls['mediaUrls']);
    }



    public function show(Post $post, Request $request): Response
    {
        $currentUser = Auth::user();

        if (Gate::denies('view', $post)) {
            abort(403, 'Unauthorized to view this post.');
        }

        $sort = $request->query('sort', 'latest');

        $post->load(array_merge(Post::STANDARD_EAGER_LOADS, [
            'comments.user.profileImage',
            'parentPost.user.profileImage',
        ]));

        $threadChain = [];
        $parent = $post->parentPost;
        while ($parent) {
            $parent->load(Post::STANDARD_EAGER_LOADS);
            array_unshift($threadChain, formatPostForFrontend($parent, $currentUser));
            $parent = $parent->parentPost;
        }

        $commentsQuery = $post->comments()->with(['user.profileImage', 'parentComment.user']);

        switch ($sort) {
            case 'likes':
                $commentsQuery->withCount('likes')->orderByDesc('likes_count');
                break;
            case 'less_likes':
                $commentsQuery->withCount('likes')->orderBy('likes_count');
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
                'raw_created_at' => $comment->created_at->toISOString(),
                'parent_comment_id' => $comment->parent_comment_id,
                'parent_comment' => $comment->parentComment ? [
                    'id' => $comment->parentComment->id,
                    'user' => [
                        'id' => $comment->parentComment->user->id,
                        'username' => $comment->parentComment->user->username,
                    ],
                ] : null,
                'reply_to_username' => $comment->parent_comment_id && preg_match('/^@(\S+)/', $comment->content, $m) ? $m[1] : null,
                'user' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'username' => $comment->user->username,
                    'profile_image' => $comment->user->profileImage,
                    'is_verified' => $comment->user->is_verified,
                ],
                'is_liked' => $comment->likes()
                    ->where('user_id', auth()->id())
                    ->where('likeable_type', Comment::class)
                    ->exists(),
                'likes_count' => $comment->likes()
                    ->where('likeable_type', Comment::class)
                    ->count(),
            ];
        });

        $postData = formatPostForFrontend($post, $currentUser);
        $postData['comments'] = $comments;
        $postData['comments_count'] = $comments->count();

        return Inertia::render('post/show-post', [
            'post' => $postData,
            'sort' => $sort,
            'thread_chain' => $threadChain,
        ]);
    }

    public function destroy(Post $post): RedirectResponse
    {
        $currentUser = Auth::user();
        $post->load(['media', 'likes', 'comments']);
        if ($currentUser->id !== $post->user_id) {
            abort(403, 'Unauthorized');
        }

        DB::transaction(function () use ($post) {
            foreach ($post->media as $media) {
                $disk = $media->disk ?? config('filesystems.default');
                if (Storage::disk($disk)->exists($media->file_path)) {
                    Storage::disk($disk)->delete($media->file_path);
                }
            }

            $post->likes()->delete();
            $post->comments()->delete();
            $post->hashtags()->detach();
            $post->media()->delete();
            $post->delete();
        });

        return redirect()->route('dashboard')->with('success', 'Post deleted successfully.');
    }



    public function edit(Post $post): Response
    {
        $this->authorize('update', $post);

        $post->load(['poll.options', 'poll.votes']);

        return Inertia::render('post/edit-post', [
            'post' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'content' => $post->content,
                'is_private' => $post->is_private,
                'media' => $post->media->map(fn ($media) => [
                    'file_path' => $media->file_path,
                    'file_type' => $media->file_type,
                    'disk' => $media->disk,
                    'url' => $media->url,
                ]),
                'hashtags' => $post->hashtags->map(fn ($tag) => [
                    'id' => $tag->id,
                    'hashtag' => $tag->hashtag,
                ]),
                'parent_post_id' => $post->parent_post_id,
                'poll' => $post->poll ? [
                    'id' => $post->poll->id,
                    'expires_at' => $post->poll->expires_at?->toISOString(),
                    'is_expired' => $post->poll->isExpired(),
                    'total_votes' => $post->poll->votes->count(),
                    'options' => $post->poll->options->map(fn($option) => [
                        'id' => $option->id,
                        'text' => $option->text,
                        'votes_count' => $post->poll->votes->where('poll_option_id', $option->id)->count(),
                    ])->toArray(),
                ] : null,
            ],
        ]);
    }


    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $this->authorize('update', $post);

        $validated = $request->validated();

        DB::transaction(function () use ($request, $validated, $post) {
            $post->update([
                'content' => $validated['content'] ?? '',
                'is_private' => $validated['is_private'] ?? false,
            ]);

            $removePaths = $validated['remove_media'] ?? [];

            if (!empty($removePaths)) {
                $mediaToRemove = $post->media()->whereIn('file_path', (array) $removePaths)->get();

                foreach ($mediaToRemove as $media) {
                    $disk = $media->disk ?? config('filesystems.default');

                    if (Storage::disk($disk)->exists($media->file_path)) {
                        Storage::disk($disk)->delete($media->file_path);
                    }

                    $media->delete();
                }
            }

            if ($request->hasFile('media')) {
                $disk = config('filesystems.default');
                $files = $request->file('media');

                foreach ($files as $file) {
                    $path = $file->store('uploads/posts', $disk);

                    $post->media()->create([
                        'file_path' => $path,
                        'file_type' => str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image',
                        'disk' => $disk,
                    ]);
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

            if (!empty($validated['remove_poll']) && $post->poll) {
                $post->poll->delete();
            }
        });

        return to_route('post.show', $post->slug)->with('success', 'Post updated successfully.');
    }

    public function togglePin(Post $post): RedirectResponse
    {
        $user = Auth::user();

        if ($post->user_id !== $user->id) {
            abort(403);
        }

        if ($user->pinned_post_id === $post->id) {
            $user->update(['pinned_post_id' => null]);
        } else {
            $user->update(['pinned_post_id' => $post->id]);
        }

        return redirect()->back();
    }
}
