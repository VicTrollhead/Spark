<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessagesRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $chatId;
    public int $readByUserId;

    public function __construct(int $chatId, int $readByUserId)
    {
        $this->chatId = $chatId;
        $this->readByUserId = $readByUserId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat.{$this->chatId}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'read_by_user_id' => $this->readByUserId,
        ];
    }
}
