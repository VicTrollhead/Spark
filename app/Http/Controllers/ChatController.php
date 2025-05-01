<?php

namespace App\Http\Controllers;

use App\Events\GotPersonalMessage;
use App\Jobs\SendMessage;
use App\Jobs\SendPersonalMessage;
use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

class ChatController extends Controller
{
    public function getEveryoneChat(Request $request): Response
    {
        $user = Auth::user();
        $messages = Message::with(['user.profileImage'])
            ->where('chat_id',null)
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
                        'profile_image_url' => $message->user->profileImage?->url,
                    ],
                ];
            })
            ->values();


        return Inertia::render('chat/everyone-chat', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
            ],
            'init_messages' => $messages,
        ]);
    }

    public function message(Request $request): RedirectResponse
    {
        $message = Message::create([
            'user_id' => auth()->id(),
            'text' => $request->get('text'),
        ]);
        SendMessage::dispatch($message);

        return redirect()->back();
    }

    public function getUserChats(Request $request): Response
    {
        $user = Auth::user();

        $chats = Chat::with(['user1.profileImage', 'user2.profileImage'])
            ->where('user1_id', $user->id)
            ->orWhere('user2_id', $user->id)
            ->get();

        $chatUserIds = $chats->map(function ($chat) use ($user) {
            return $chat->user1_id === $user->id ? $chat->user2_id : $chat->user1_id;
        })->push($user->id);

        $chatData = $chats->map(function ($chat) use ($user) {
            $otherUser = $chat->user1_id === $user->id ? $chat->user2 : $chat->user1;
            return [
                'id' => $chat->id,
                'user' => [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'username' => $otherUser->username,
                    'profile_image_url' => $otherUser->profileImage?->url,
                ],
                'last_message' => $chat->lastMessage ? [
                    'user_id' => $chat->lastMessage->user_id,
                    'text' => $chat->lastMessage->text,
                    'time' => $chat->lastMessage->created_at->format('d M Y, H:i:s'),
                ] : null,
            ];
        });

        $users = $user->friends()
            ->whereNotIn('users.id', $chatUserIds)
            ->with('profileImage')
            ->latest()
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'profile_image_url' => $user->profileImage?->url,
                ];
            });

        return Inertia::render('chat/user-chats', [
            'chats' => $chatData,
            'users' => $users,
        ]);
    }

    public function getUserChat(User $otherUser): Response
    {
        $user = Auth::user();

        $chat = Chat::getChat($user->id, $otherUser->id);

        if (!$chat) {
            abort(404, 'Chat not found');
        }

        $messages = Message::with(['user.profileImage'])
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
                        'profile_image_url' => $message->user->profileImage?->url,
                    ],
                ];
            })
            ->values();

        return Inertia::render('chat/user-chat', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
            ],
            'chat_id' => $chat->id,
            'other_user' => [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'username' => $otherUser->username,
                'profile_image_url' => $otherUser->profileImage?->url,
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

        $chat = Chat::firstOrCreateChat($user->id, $otherUser->id);

        return redirect()->route('chat.getUserChat', ['user' => $otherUser->id]);
    }


    public function postMessageToUserChat(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'chatId' => 'required|exists:chats,id',
            'text' => 'required|string|max:1000',
        ]);

        $user = Auth::user();

        $message = Message::create([
            'user_id' => $user->id,
            'chat_id' => $validated['chatId'],
            'text' => $validated['text'],
        ]);

        Chat::where('id', $validated['chatId'])
            ->update(['last_message_id' => $message->id]);

        event(new GotPersonalMessage($message, $validated['chatId']));

        return redirect()->back();
    }

    public function deleteMessage(Message $message): RedirectResponse
    {
        $user = Auth::user();

        if ($message->user_id !== $user->id) {
            abort(403, 'You cannot delete this message.');
        }

        $chat = $message->chat;

        $message->delete();

        if ($chat != null && $chat->last_message_id === $message->id) {
            $previousMessage = Message::where('chat_id', $chat->id)
                ->latest('created_at')
                ->first();

            $chat->last_message_id = $previousMessage?->id;
            $chat->save();
        }

        return redirect()->back()->with('success', 'The message has been deleted.');
    }

}
