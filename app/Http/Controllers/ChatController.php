<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\GotPersonalMessage;
use App\Events\MessagesRead;
use App\Events\UserMessageCreated;
use App\Events\UserMessageIsReadChange;
use App\Events\UserTyping;
use App\Jobs\SendMessage;
use App\Models\Chat;
use App\Models\GroupChat;
use App\Models\Media;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function getEveryoneChat(Request $request): Response
    {
        $user = Auth::user();
        $messages = Message::with(['user.profileImage'])
            ->where('chat_id', null)
            ->latest()
            ->take(50)
            ->get()
            ->sortBy('created_at')
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'text' => $message->text,
                    'chat_id' => $message->chat_id,
                    'time' => $message->created_at->format('d M Y, H:i:s'),
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'username' => $message->user->username,
                        'profile_image' => $message->user->profileImage,
                        'is_verified' => $message->user->is_verified,
                    ],
                ];
            })
            ->values();

        return Inertia::render('chat/everyone-chat', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'is_verified' => $user->is_verified,
            ],
            'init_messages' => $messages,
        ]);
    }

    public function message(Request $request): RedirectResponse
    {
        $request->validate([
            'text' => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'user_id' => auth()->id(),
            'text' => $request->input('text'),
        ]);
        SendMessage::dispatch($message);

        return redirect()->back();
    }

    public function getUserChats(Request $request): Response
    {
        $user = Auth::user();

        $chats = Chat::with(['user1.profileImage', 'user2.profileImage', 'lastMessage'])
            ->where(function ($query) use ($user) {
                $query->where('user1_id', $user->id)
                    ->orWhere('user2_id', $user->id);
            })
            ->get();

        $chatUserIds = $chats->map(function ($chat) use ($user) {
            return $chat->user1_id === $user->id ? $chat->user2_id : $chat->user1_id;
        })->push($user->id);

        $chatData = $chats
            ->filter(fn ($chat) => $chat->last_message_id !== null)
            ->map(function ($chat) use ($user) {
                $otherUser = $chat->user1_id === $user->id ? $chat->user2 : $chat->user1;

                $unreadCount = $chat->messages()
                    ->whereNull('read_at')
                    ->where('user_id', '!=', $user->id)
                    ->count();

                return [
                    'id' => $chat->id,
                    'user' => [
                        'id' => $otherUser->id,
                        'name' => $otherUser->name,
                        'username' => $otherUser->username,
                        'profile_image' => $otherUser->profileImage,
                        'is_verified' => $otherUser->is_verified,
                    ],
                    'last_message' => $chat->lastMessage ? [
                        'user_id' => $chat->lastMessage->user_id,
                        'text' => $chat->lastMessage->text,
                        'time' => $chat->lastMessage->created_at->format('d M Y, H:i:s'),
                        'created_at' => $chat->lastMessage->created_at,
                    ] : null,
                    'unread_count' => $unreadCount,
                ];
            })->sortByDesc(fn ($chat) => $chat['last_message']['created_at'] ?? now()->subYears(10))->values();

        // All users (except self) grouped by relationship — used for group chat creation
        $allUsers = User::with('profileImage')
            ->where('id', '!=', $user->id)
            ->get();

        $mutuals = $user->friends()->pluck('users.id')->toArray();
        $followers = $user->followers()->pluck('users.id')->toArray();
        $following = $user->following()->pluck('users.id')->toArray();

        $groupedUsers = [
            'Mutuals' => [],
            'Followers' => [],
            'Following' => [],
            'Others' => [],
        ];

        foreach ($allUsers as $u) {
            if (in_array($u->id, $mutuals)) {
                $groupedUsers['Mutuals'][] = $u;
            } elseif (in_array($u->id, $followers)) {
                $groupedUsers['Followers'][] = $u;
            } elseif (in_array($u->id, $following)) {
                $groupedUsers['Following'][] = $u;
            } else {
                $groupedUsers['Others'][] = $u;
            }
        }

        $mapUser = fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'username' => $u->username,
            'profile_image' => $u->profileImage,
            'has_chat' => $chatUserIds->contains($u->id),
        ];

        $users = [];
        foreach ($groupedUsers as $group => $list) {
            $users[] = [
                'label' => $group,
                'users' => collect($list)->map($mapUser),
            ];
        }

        $groupChats = GroupChat::with(['members.profileImage', 'lastMessage'])
            ->whereHas('members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get()
            ->map(function ($gc) {
                return [
                    'id' => $gc->id,
                    'name' => $gc->name,
                    'member_count' => $gc->members->count(),
                    'last_message' => $gc->lastMessage ? [
                        'user_id' => $gc->lastMessage->user_id,
                        'text' => $gc->lastMessage->text,
                        'time' => $gc->lastMessage->created_at->format('d M Y, H:i:s'),
                        'created_at' => $gc->lastMessage->created_at,
                    ] : null,
                ];
            })
            ->sortByDesc(fn ($gc) => $gc['last_message']['created_at'] ?? now()->subYears(10))
            ->values();

        return Inertia::render('chat/user-chats', [
            'chats' => $chatData,
            'group_chats' => $groupChats,
            'users' => $users,
        ]);
    }

    public function getUserChat(User $otherUser): Response
    {
        $user = Auth::user();

        if ($user->id === $otherUser->id) {
            abort(400, "You can't chat with yourself");
        }

        $chat = Chat::getChat($user->id, $otherUser->id);

        $messages = collect();
        if ($chat) {
            $messages = Message::with(['user.profileImage', 'media'])
                ->where('chat_id', $chat->id)
                ->latest()
                ->take(50)
                ->get()
                ->sortBy('created_at')
                ->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'text' => $message->text,
                        'chat_id' => $message->chat_id,
                        'time' => $message->created_at->format('d M Y, H:i:s'),
                        'user' => [
                            'id' => $message->user->id,
                            'name' => $message->user->name,
                            'username' => $message->user->username,
                            'profile_image' => $message->user->profileImage,
                            'is_verified' => $message->user->is_verified,
                        ],
                        'read_at' => $message->read_at,
                        'media' => $message->media->map(fn ($media) => [
                            'file_path' => $media->file_path,
                            'file_type' => $media->file_type,
                            'url' => $media->url,
                        ]),
                    ];
                })
                ->values();
        }

        return Inertia::render('chat/user-chat', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'is_verified' => $user->is_verified,
            ],
            'chat_id' => $chat?->id,
            'other_user' => [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'username' => $otherUser->username,
                'profile_image' => $otherUser->profileImage,
                'is_verified' => $otherUser->is_verified,
            ],
            'init_messages' => $messages,
        ]);
    }

    public function searchOrCreateUserChat(User $otherUser): RedirectResponse
    {
        $user = Auth::user();

        if ($user->id === $otherUser->id) {
            abort(400, "You can't create a chat with yourself");
        }

        return redirect()->route('chat.getUserChat', ['user' => $otherUser->id]);
    }

    public function postMessageToUserChat(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'chatId' => 'nullable|exists:chats,id',
            'otherUserId' => 'nullable|exists:users,id',
            'text' => 'nullable|string|max:1000',
            'media' => 'nullable|array|max:4',
            'media.*' => ['file', 'mimetypes:'.Media::ALLOWED_POST_MIMETYPES, 'max:10240'],
        ], [
            'media.max' => 'You can attach up to 4 files per message.',
            'media.*.mimetypes' => 'Attachments must be a JPEG, PNG, GIF, WebP image or an MP4, MOV or WebM video.',
            'media.*.max' => 'Each attachment must be 10 MB or smaller.',
        ]);

        if (empty($validated['chatId']) && empty($validated['otherUserId'])) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'chatId or otherUserId is required.'], 422);
            }

            return redirect()->back()->withErrors(['chatId' => 'chatId or otherUserId is required.']);
        }

        if (empty($validated['text']) && ! $request->hasFile('media')) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'A message or file is required.'], 422);
            }

            return redirect()->back()->withErrors(['text' => 'A message or file is required.']);
        }

        $user = Auth::user();

        if (! empty($validated['chatId'])) {
            $chat = Chat::findOrFail($validated['chatId']);
        } else {
            $chat = Chat::firstOrCreateChat($user->id, (int) $validated['otherUserId']);
        }

        if ($chat->user1_id !== $user->id && $chat->user2_id !== $user->id) {
            abort(403, 'You are not a participant of this chat.');
        }

        $recipientId = $chat->user1_id === $user->id ? $chat->user2_id : $chat->user1_id;

        $message = Message::create([
            'user_id' => $user->id,
            'chat_id' => $chat->id,
            'text' => $validated['text'] ?? '',
        ]);

        if ($request->hasFile('media')) {
            $disk = config('filesystems.default');
            foreach ($request->file('media') as $file) {
                $path = $file->store('uploads/chat', $disk);
                $message->media()->create([
                    'file_path' => $path,
                    'file_type' => str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image',
                    'disk' => $disk,
                ]);
            }
        }

        $chat->update(['last_message_id' => $message->id]);

        if ($recipientId !== $user->id) {
            NotificationService::create([
                'user_id' => $recipientId,
                'source_user_id' => $user->id,
                'type' => 'message',
                'extra_data' => $message->text ?: '📎 Attachment',
                'message_id' => $message->id,
            ]);
        }

        event(new GotPersonalMessage($message, $chat->id));
        event(new UserMessageCreated($message, $recipientId));

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'chat_id' => $chat->id]);
        }

        return redirect()->back();
    }

    public function deleteMessage(Message $message): RedirectResponse
    {
        $user = Auth::user();

        if ($message->user_id !== $user->id) {
            abort(403, 'You cannot delete this message.');
        }

        $chat = $message->chat;

        $recipientId = null;
        if (! is_null($chat)) {
            $recipientId = $chat->user1_id === $user->id ? $chat->user2_id : $chat->user1_id;
        }

        DB::transaction(function () use ($message, $chat) {
            Notification::where('type', 'message')
                ->where('source_user_id', $message->user_id)
                ->where('message_id', $message->id)
                ->delete();

            $message->delete();

            if ($chat != null && $chat->last_message_id === $message->id) {
                $previousMessage = Message::where('chat_id', $chat->id)
                    ->latest('created_at')
                    ->first();

                $chat->last_message_id = $previousMessage?->id;
                $chat->save();
            }
        });
        if (! is_null($recipientId)) {
            event(new UserMessageIsReadChange($recipientId, 'delete'));
        }

        return redirect()->back()->with('success', 'The message has been deleted.');
    }

    public function markAsRead(Request $request, Chat $chat): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $user = Auth::user();

        $messages = Message::where('chat_id', $chat->id)
            ->where('user_id', '!=', $user->id)
            ->whereNull('read_at')
            ->get();

        if ($messages->isEmpty()) {
            if ($request->wantsJson()) {
                return response()->json(['success' => true]);
            }

            return redirect()->back();
        }

        $messages->each(function ($message) use ($user) {
            $message->update(['read_at' => now()]);

            Notification::where('type', 'message')
                ->where('message_id', $message->id)
                ->where('user_id', $user->id)
                ->update(['is_read' => true]);
        });

        $recipientId = $chat->user1_id === $user->id ? $chat->user2_id : $chat->user1_id;

        if (! is_null($recipientId)) {
            event(new UserMessageIsReadChange($recipientId, 'read'));
        }

        event(new MessagesRead($chat->id, $user->id));

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()->back();
    }

    public function getUnreadMessagesCount(Request $request): JsonResponse
    {
        $currentUser = Auth::user();

        $unreadCount = Message::whereHas('chat', function ($query) use ($currentUser) {
            $query->where('user1_id', $currentUser->id)
                ->orWhere('user2_id', $currentUser->id);
        })
            ->where('user_id', '!=', $currentUser->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }

    public function typing(Chat $chat): HttpResponse
    {
        $user = Auth::user();

        if ($chat->user1_id !== $user->id && $chat->user2_id !== $user->id) {
            abort(403);
        }

        event(new UserTyping($user->id, $user->name, $chat->id));

        return response()->noContent();
    }

    public function deleteChat(Chat $chat): RedirectResponse
    {
        $user = Auth::user();

        if ($chat->user1_id !== $user->id && $chat->user2_id !== $user->id) {
            abort(403, 'You are not a participant of this chat.');
        }

        DB::transaction(function () use ($chat) {
            // Delete media files from storage and records
            $messages = $chat->messages()->with('media')->get();
            foreach ($messages as $message) {
                foreach ($message->media as $media) {
                    $disk = $media->disk ?? config('filesystems.default');
                    Storage::disk($disk)->delete($media->file_path);
                    $media->delete();
                }
            }

            // Delete notifications related to this chat's messages
            $messageIds = $messages->pluck('id');
            Notification::where('type', 'message')
                ->whereIn('message_id', $messageIds)
                ->delete();

            // Delete all messages then the chat
            $chat->messages()->delete();
            $chat->delete();
        });

        return redirect()->route('chat.getUserChats');
    }
}
