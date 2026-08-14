<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\Notification;

class NotificationService
{
    public static function create(array $data): Notification
    {
        $notification = Notification::create([
            'user_id' => $data['user_id'],
            'source_user_id' => $data['source_user_id'],
            'type' => $data['type'],
            'post_id' => $data['post_id'] ?? null,
            'extra_data' => $data['extra_data'] ?? null,
            'comment_id' => $data['comment_id'] ?? null,
            'message_id' => $data['message_id'] ?? null,
            'is_read' => $data['is_read'] ?? 0,
        ]);
        event(new NotificationCreated($notification));

        return $notification;
    }
}
