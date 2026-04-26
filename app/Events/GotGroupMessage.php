<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GotGroupMessage implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;
    public int $groupChatId;

    public function __construct(Message $message, int $groupChatId)
    {
        $this->message = $message;
        $this->groupChatId = $groupChatId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("group-chat.{$this->groupChatId}"),
        ];
    }

    public function broadcastWith(): array
    {
        $this->message->load('media');

        return [
            'id' => $this->message->id,
            'text' => $this->message->text,
            'user' => [
                'id' => $this->message->user->id,
                'name' => $this->message->user->name,
                'username' => $this->message->user->username,
                'profile_image' => $this->message->user->profileImage,
                'is_verified' => $this->message->user->is_verified,
            ],
            'time' => $this->message->time,
            'group_chat_id' => $this->groupChatId,
            'media' => $this->message->media->map(fn($media) => [
                'file_path' => $media->file_path,
                'file_type' => $media->file_type,
                'url' => $media->url,
            ])->toArray(),
        ];
    }
}
