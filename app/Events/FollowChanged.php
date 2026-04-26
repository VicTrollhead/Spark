<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FollowChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $targetUserId;
    public string $action;
    public int $followerCount;
    public int $followingCount;

    public function __construct(int $targetUserId, string $action, int $followerCount, int $followingCount)
    {
        $this->targetUserId = $targetUserId;
        $this->action = $action;
        $this->followerCount = $followerCount;
        $this->followingCount = $followingCount;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->targetUserId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'follower_count' => $this->followerCount,
            'following_count' => $this->followingCount,
        ];
    }
}
