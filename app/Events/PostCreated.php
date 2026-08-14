<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $post;

    private array $followerIds;

    public function __construct(array $post, array $followerIds)
    {
        $this->post = $post;
        $this->followerIds = $followerIds;
    }

    /**
     * Broadcast to each follower's personal feed channel.
     */
    public function broadcastOn(): array
    {
        return array_map(
            fn ($id) => new PrivateChannel('feed.'.$id),
            $this->followerIds
        );
    }

    public function broadcastWith(): array
    {
        return ['post' => $this->post];
    }
}
