<?php

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Builder;

if (! function_exists('notifyMentionedUsers')) {
    function notifyMentionedUsers(string $content, int $sourceUserId, ?int $postId = null, ?int $commentId = null): void
    {
        preg_match_all('/@([\w.]+)/', $content, $matches);
        $matches[1] = array_map(fn ($u) => rtrim($u, '.'), $matches[1]);
        $usernames = array_unique($matches[1] ?? []);

        if (empty($usernames)) {
            return;
        }

        $users = User::whereIn('username', $usernames)
            ->where('id', '!=', $sourceUserId)
            ->get();

        foreach ($users as $user) {
            NotificationService::create([
                'user_id' => $user->id,
                'source_user_id' => $sourceUserId,
                'type' => 'mention',
                'post_id' => $postId,
                'comment_id' => $commentId,
                'extra_data' => $content,
            ]);
        }
    }
}

if (! function_exists('formatPostForFrontend')) {
    /**
     * Transform an Eloquent Post model into a frontend-ready array.
     *
     * Expects $post to have eager-loaded relations from postBaseQuery().
     *
     * @param  \App\Models\Post  $post
     * @return array<string, mixed>
     */
    function formatPostForFrontend($post, ?User $currentUser): array
    {
        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'content' => $post->content,
            'created_at' => $post->created_at->format('n/j/Y'),
            'raw_created_at' => $post->created_at->toISOString(),
            'reposted_at' => $post->reposted_at ? \Carbon\Carbon::parse($post->reposted_at)->format('n/j/Y') : null,
            'user' => [
                'id' => $post->user->id,
                'name' => $post->user->name,
                'username' => $post->user->username,
                'profile_image' => $post->user->profileImage,
                'is_verified' => $post->user->is_verified,
            ],
            'hashtags' => $post->hashtags->map(fn ($tag) => [
                'id' => $tag->id,
                'hashtag' => $tag->hashtag,
            ]),
            'media' => $post->media->map(fn ($media) => [
                'file_path' => $media->file_path,
                'file_type' => $media->file_type,
                'disk' => $media->disk,
                'url' => $media->url,
            ]),
            'parent_post_id' => $post->parent_post_id,
            'parent_post' => $post->parentPost ? [
                'id' => $post->parentPost->id,
                'slug' => $post->parentPost->slug,
                'content' => \Illuminate\Support\Str::limit($post->parentPost->content, 120),
                'user' => [
                    'id' => $post->parentPost->user->id,
                    'name' => $post->parentPost->user->name,
                    'username' => $post->parentPost->user->username,
                ],
            ] : null,
            'quote_post' => $post->quotePost ? [
                'id' => $post->quotePost->id,
                'slug' => $post->quotePost->slug,
                'content' => $post->quotePost->content,
                'created_at' => $post->quotePost->created_at->format('n/j/Y'),
                'user' => [
                    'id' => $post->quotePost->user->id,
                    'name' => $post->quotePost->user->name,
                    'username' => $post->quotePost->user->username,
                    'profile_image' => $post->quotePost->user->profileImage,
                    'is_verified' => $post->quotePost->user->is_verified,
                ],
                'media' => $post->quotePost->media->take(1)->map(fn ($media) => [
                    'file_path' => $media->file_path,
                    'file_type' => $media->file_type,
                    'disk' => $media->disk,
                    'url' => $media->url,
                ]),
            ] : null,
            'is_pinned' => $currentUser && $currentUser->pinned_post_id === $post->id,
            'is_private' => $post->is_private,
            'likes_count' => $post->likes->count(),
            'is_liked' => $currentUser ? $post->likes->contains('user_id', $currentUser->id) : false,
            'favorites_count' => $post->favorites->count(),
            'is_favorited' => $currentUser ? $post->favorites->contains('user_id', $currentUser->id) : false,
            'comments_count' => $post->comments->count(),
            'replies_count' => $post->replies->count(),
            'quotes_count' => $post->quotedByPosts->count(),
            'reposts_count' => $post->repostedByUsers->count(),
            'is_reposted' => $currentUser ? $post->repostedByUsers->contains('id', $currentUser->id) : false,
            'reposted_by_you' => $currentUser && $post->repostedByUsers->contains('id', $currentUser->id),
            'reposted_by_recent' => $post->repostedByUsers
                ->where('id', '!=', $post->user_id)
                ->when($currentUser, fn ($collection) => $collection->where('id', '!=', $currentUser->id))
                ->take(3)
                ->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'profile_image' => $user->profileImage,
                    'is_verified' => $user->is_verified,
                ])
                ->values()
                ->toArray(),
            'current_user' => $currentUser ? [
                'id' => $currentUser->id,
                'username' => $currentUser->username,
                'profile_image' => $currentUser->profileImage,
                'name' => $currentUser->name,
                'is_verified' => $currentUser->is_verified,
            ] : null,
            'poll' => $post->poll ? [
                'id' => $post->poll->id,
                'expires_at' => $post->poll->expires_at?->toISOString(),
                'is_expired' => $post->poll->isExpired(),
                'total_votes' => $post->poll->votes->count(),
                'user_vote_option_id' => $currentUser
                    ? $post->poll->votes->where('user_id', $currentUser->id)->first()?->poll_option_id
                    : null,
                'options' => $post->poll->options->map(fn ($option) => [
                    'id' => $option->id,
                    'text' => $option->text,
                    'votes_count' => $post->poll->votes->where('poll_option_id', $option->id)->count(),
                ])->toArray(),
            ] : null,
        ];
    }
}

if (! function_exists('postBaseQuery')) {
    /**
     * Build a base Post query with all relations eager-loaded and visibility filtering applied.
     *
     * Returns posts that are public, owned by the current user, or owned by users the current user follows.
     */
    function postBaseQuery(?User $currentUser): Builder
    {
        return \App\Models\Post::with(\App\Models\Post::STANDARD_EAGER_LOADS)
            ->visibleTo($currentUser);
    }
}
