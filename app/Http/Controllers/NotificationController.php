<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\NotificationIsReadChange;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $currentUser = Auth::user();

        $sort = $request->get('sort', 'unread');

        $query = Notification::with([
            'post.user.profileImage',
            'post.media',
            'sourceUser.profileImage',
        ])
            ->where('user_id', $currentUser->id);

        switch ($sort) {
            case 'oldest':
                $query->oldest();
                break;
            case 'latest':
                $query->latest();
                break;
            case 'read':
                $query->where('is_read', true)->latest();
                break;
            case 'unread':
            default:
                $query->where('is_read', false)->latest();
                break;
        }

        $notifications = $query->get();

        $readCount = Notification::where('user_id', $currentUser->id)->where('is_read', true)->count();
        $unreadCount = Notification::where('user_id', $currentUser->id)->where('is_read', false)->count();

        $formattedNotifications = $notifications->map(function ($notification) use ($currentUser) {
            $post = $notification->post;
            $sourceUser = $notification->sourceUser;

            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'is_read' => $notification->is_read,
                'created_at' => $notification->created_at->diffForHumans(),

                'source_user' => $sourceUser ? [
                    'id' => $sourceUser->id,
                    'name' => $sourceUser->name,
                    'username' => $sourceUser->username,
                    'profile_image' => $sourceUser->profileImage,
                    'is_private' => (bool) $sourceUser->is_private,
                    'is_subscribed' => $currentUser->isFollowing($sourceUser),
                    'is_verified' => $sourceUser->is_verified,
                ] : null,

                'post' => $post ? [
                    'id' => $post->id,
                    'slug' => $post->slug,
                    'content' => $post->content,
                    'user' => [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                        'username' => $post->user->username,
                        'profile_image' => $post->user->profileImage,
                        'is_verified' => $post->user->is_verified,
                    ],
                    'media' => $post->media->map(fn($m) => [
                        'file_path' => $m->file_path,
                        'file_type' => $m->file_type,
                        'disk' => $m->disk,
                        'url' => $m->url,
                    ])->values(),
                ] : null,

                'extra_data' => $notification->extra_data,
            ];
        });

        if ($request->wantsJson()) {
            return response()->json([
                'notifications' => $formattedNotifications,
                'sort' => $sort,
                'read_count' => $readCount,
                'unread_count' => $unreadCount,
            ]);
        }

        return Inertia::render('user/notifications', [
            'user' => [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'username' => $currentUser->username,
                'profile_image' => $currentUser->profileImage,
                'is_verified' => $currentUser->is_verified
            ],
            'notifications' => $formattedNotifications,
            'sort' => $sort,
            'read_count' => $readCount,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse|RedirectResponse
    {
        if ($notification->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $wasUnread = !$notification->is_read;
        $notification->is_read = true;
        $notification->save();

        if ($wasUnread) {
            event(new NotificationIsReadChange($notification, 'read'));
        }

        if ($request->wantsJson()) {
            $userId = Auth::id();
            return response()->json([
                'unread_count' => Notification::where('user_id', $userId)->where('is_read', false)->count(),
                'read_count' => Notification::where('user_id', $userId)->where('is_read', true)->count(),
            ]);
        }

        return redirect()->back();
    }

    public function markAsUnread(Request $request, Notification $notification): JsonResponse|RedirectResponse
    {
        if ($notification->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $wasRead = $notification->is_read;
        $notification->is_read = false;
        $notification->save();

        if ($wasRead) {
            event(new NotificationIsReadChange($notification, 'unread'));
        }

        if ($request->wantsJson()) {
            $userId = Auth::id();
            return response()->json([
                'unread_count' => Notification::where('user_id', $userId)->where('is_read', false)->count(),
                'read_count' => Notification::where('user_id', $userId)->where('is_read', true)->count(),
            ]);
        }

        return redirect()->back();
    }

    public function getUnreadNotificationsCount(Request $request): JsonResponse
    {
        $currentUser = Auth::user();

        $unreadCount = Notification::where('user_id', $currentUser->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse|RedirectResponse
    {
        $user = Auth::user();
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $notification = Notification::where('user_id', $user->id)->first();
        if ($notification) {
            event(new NotificationIsReadChange($notification, 'allRead'));
        }

        if ($request->wantsJson()) {
            return response()->json([
                'unread_count' => 0,
                'read_count' => Notification::where('user_id', $user->id)->count(),
            ]);
        }

        return back();
    }

    public function markAllAsUnread(Request $request): JsonResponse|RedirectResponse
    {
        $user = Auth::user();

        $user->notifications()->update(['is_read' => false]);

        $notification = Notification::where('user_id', $user->id)->first();
        if ($notification) {
            event(new NotificationIsReadChange($notification, 'allUnread'));
        }

        if ($request->wantsJson()) {
            return response()->json([
                'unread_count' => Notification::where('user_id', $user->id)->count(),
                'read_count' => 0,
            ]);
        }

        return back();
    }
}
