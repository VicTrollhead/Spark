<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = Auth::user();

        $notifications = Notification::with([
            'post.user.profileImage',
            'post.media',
            'sourceUser.profileImage',
        ])
            ->where('user_id', $currentUser->id)
            ->latest()
            ->get();

        $formattedNotifications = $notifications->map(function ($notification) {
            $post = $notification->post;

            return [
                'id'         => $notification->id,
                'type'       => $notification->type,
                'is_read'    => $notification->is_read,
                'created_at' => $notification->created_at->diffForHumans(),

                'source_user' => $notification->sourceUser
                    ? [
                        'id'                => $notification->sourceUser->id,
                        'name'              => $notification->sourceUser->name,
                        'username'          => $notification->sourceUser->username,
                        'profile_image_url' => $notification->sourceUser->profileImage?->url,
                    ]
                    : null,

                'post' => $post
                    ? [
                        'id'      => $post->id,
                        'content' => $post->content,

                        'user' => [
                            'id'                => $post->user->id,
                            'name'              => $post->user->name,
                            'username'          => $post->user->username,
                            'profile_image_url' => $post->user->profileImage?->url,
                        ],

                        'media' => $post->media->map(fn($m) => [
                            'file_path' => $m->file_path,
                            'file_type' => $m->file_type,
                        ])->values(),
                    ]
                    : null,

                'extra_data' => $notification->extra_data,
            ];
        });

        return Inertia::render('user/notifications', [
            'user'          => [
                'id'                => $currentUser->id,
                'name'              => $currentUser->name,
                'username'          => $currentUser->username,
                'profile_image_url' => $currentUser->profileImage?->url,
            ],
            'notifications' => $formattedNotifications,
            'translations'  => [
                'Notifications'      => 'Notifications',
                'No notifications yet.' => 'No notifications yet.',
            ],
        ]);
    }

}
