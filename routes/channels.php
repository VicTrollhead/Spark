<?php

use App\Models\Chat;
use App\Models\GroupChat;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('channel_for_everyone', function ($user) {
    return true;
});

Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    return Chat::where('id', $chatId)
        ->where(function ($q) use ($user) {
            $q->where('user1_id', $user->id)
                ->orWhere('user2_id', $user->id);
        })
        ->exists();
});

Broadcast::channel('user-chats.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('group-chat.{groupChatId}', function ($user, $groupChatId) {
    return GroupChat::where('id', $groupChatId)
        ->whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->exists();
});

Broadcast::channel('feed.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('user.{userId}', function ($user) {
    return true; // Public profile data — anyone can listen
});

Broadcast::channel('presence-online', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'username' => $user->username,
    ];
});

Broadcast::channel('post.{postId}', function ($user, $postId) {
    $post = \App\Models\Post::find($postId);
    if (! $post) {
        return false;
    }
    if (! $post->is_private) {
        return true;
    }

    return $post->user_id === $user->id
        || $post->user->followers()->where('follower_id', $user->id)->exists();
});
