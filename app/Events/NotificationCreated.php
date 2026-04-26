<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    public function __construct($notification)
    {
        $this->notification = $notification;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('notifications.' . $this->notification->user_id);
    }

    public function broadcastWith()
    {
        $this->notification->load(['sourceUser.profileImage', 'post.user.profileImage', 'post.media']);

        $sourceUser = $this->notification->sourceUser;
        $post = $this->notification->post;

        return [
            'id' => $this->notification->id,
            'type' => $this->notification->type,
            'is_read' => (bool) $this->notification->is_read,
            'created_at' => $this->notification->created_at->diffForHumans(),
            'extra_data' => $this->notification->extra_data,
            'source_user' => $sourceUser ? [
                'id' => $sourceUser->id,
                'name' => $sourceUser->name,
                'username' => $sourceUser->username,
                'profile_image' => $sourceUser->profileImage,
                'is_verified' => $sourceUser->is_verified,
            ] : null,
            'post' => $post ? [
                'id' => $post->id,
                'content' => $post->content,
                'user' => [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                    'username' => $post->user->username,
                    'profile_image' => $post->user->profileImage,
                    'is_verified' => $post->user->is_verified,
                ],
            ] : null,
        ];
    }
}
