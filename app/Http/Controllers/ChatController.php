<?php

namespace App\Http\Controllers;

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
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $messages = Message::with(['user.profileImage'])
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


        return Inertia::render('chat', [
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
}
