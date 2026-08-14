<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostEngagementChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $postId;

    public int $likesCount;

    public int $favoritesCount;

    public int $repostsCount;

    public function __construct(int $postId, int $likesCount, int $favoritesCount, int $repostsCount)
    {
        $this->postId = $postId;
        $this->likesCount = $likesCount;
        $this->favoritesCount = $favoritesCount;
        $this->repostsCount = $repostsCount;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('post.'.$this->postId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'post_id' => $this->postId,
            'likes_count' => $this->likesCount,
            'favorites_count' => $this->favoritesCount,
            'reposts_count' => $this->repostsCount,
        ];
    }
}
