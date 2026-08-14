<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class UserMessageIsReadChange implements ShouldBroadcast
{
    public $userId;

    public $operation;

    public function __construct($recipientId, $operation)
    {
        $this->userId = $recipientId;
        $this->operation = $operation;
    }

    public function broadcastOn()
    {
        if (is_null($this->userId)) {
            throw new \Exception('User ID for broadcasting is null.');
        }

        return new PrivateChannel('user-chats.'.$this->userId);
    }

    public function broadcastWith()
    {
        return [
            'operation' => $this->operation,
        ];
    }
}
