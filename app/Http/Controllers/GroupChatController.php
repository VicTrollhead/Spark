<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\GotGroupMessage;
use App\Models\GroupChat;
use App\Models\Media;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GroupChatController extends Controller
{
    public function show(GroupChat $groupChat): Response
    {
        $user = Auth::user();

        if (! $groupChat->members()->where('user_id', $user->id)->exists()) {
            abort(403, 'You are not a member of this group chat.');
        }

        $messages = Message::with(['user.profileImage', 'media'])
            ->where('group_chat_id', $groupChat->id)
            ->latest()
            ->take(50)
            ->get()
            ->sortBy('created_at')
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'text' => $message->text,
                    'group_chat_id' => $message->group_chat_id,
                    'time' => $message->created_at->format('d M Y, H:i:s'),
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'username' => $message->user->username,
                        'profile_image' => $message->user->profileImage,
                        'is_verified' => $message->user->is_verified,
                    ],
                    'media' => $message->media->map(fn ($media) => [
                        'file_path' => $media->file_path,
                        'file_type' => $media->file_type,
                        'url' => $media->url,
                    ]),
                ];
            })
            ->values();

        $members = $groupChat->members()->with('profileImage')->get()->map(fn ($member) => [
            'id' => $member->id,
            'name' => $member->name,
            'username' => $member->username,
            'profile_image' => $member->profileImage,
            'is_verified' => $member->is_verified,
        ]);

        return Inertia::render('chat/group-chat', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'is_verified' => $user->is_verified,
            ],
            'group_chat' => [
                'id' => $groupChat->id,
                'name' => $groupChat->name,
                'creator_id' => $groupChat->creator_id,
            ],
            'members' => $members,
            'init_messages' => $messages,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'member_ids' => 'required|array|min:1',
            'member_ids.*' => 'exists:users,id',
        ]);

        $user = Auth::user();

        $groupChat = GroupChat::create([
            'name' => $validated['name'],
            'creator_id' => $user->id,
        ]);

        $memberIds = array_unique(array_merge($validated['member_ids'], [$user->id]));
        $groupChat->members()->attach($memberIds);

        return redirect()->route('groupChat.show', $groupChat->id);
    }

    public function postMessage(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'groupChatId' => 'required|exists:group_chats,id',
            'text' => 'nullable|string|max:1000',
            'media' => 'nullable|array|max:4',
            'media.*' => ['file', 'mimetypes:'.Media::ALLOWED_POST_MIMETYPES, 'max:10240'],
        ], [
            'media.max' => 'You can attach up to 4 files per message.',
            'media.*.mimetypes' => 'Attachments must be a JPEG, PNG, GIF, WebP image or an MP4, MOV or WebM video.',
            'media.*.max' => 'Each attachment must be 10 MB or smaller.',
        ]);

        if (empty($validated['text']) && ! $request->hasFile('media')) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'A message or file is required.'], 422);
            }

            return redirect()->back()->withErrors(['text' => 'A message or file is required.']);
        }

        $user = Auth::user();
        $groupChat = GroupChat::findOrFail($validated['groupChatId']);

        if (! $groupChat->members()->where('user_id', $user->id)->exists()) {
            abort(403, 'You are not a member of this group chat.');
        }

        $message = Message::create([
            'user_id' => $user->id,
            'group_chat_id' => $validated['groupChatId'],
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

        event(new GotGroupMessage($message, $groupChat->id));

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()->back();
    }

    public function addMembers(Request $request, GroupChat $groupChat): RedirectResponse
    {
        $user = Auth::user();

        if ($groupChat->creator_id !== $user->id) {
            abort(403, 'Only the group creator can add members.');
        }

        $validated = $request->validate([
            'member_ids' => 'required|array|min:1',
            'member_ids.*' => 'exists:users,id',
        ]);

        $groupChat->members()->syncWithoutDetaching($validated['member_ids']);

        return redirect()->back();
    }

    public function update(Request $request, GroupChat $groupChat): RedirectResponse
    {
        $user = Auth::user();

        if ($groupChat->creator_id !== $user->id) {
            abort(403, 'Only the group creator can rename the group.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $groupChat->update(['name' => $validated['name']]);

        return redirect()->back();
    }

    public function removeMember(Request $request, GroupChat $groupChat): RedirectResponse
    {
        $user = Auth::user();

        if ($groupChat->creator_id !== $user->id) {
            abort(403, 'Only the group creator can remove members.');
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        if ((int) $validated['user_id'] === $user->id) {
            abort(400, 'You cannot remove yourself. Use leave instead.');
        }

        $groupChat->members()->detach($validated['user_id']);

        return redirect()->back();
    }

    public function destroy(GroupChat $groupChat): RedirectResponse
    {
        $user = Auth::user();

        if ($groupChat->creator_id !== $user->id) {
            abort(403, 'Only the group creator can delete the group.');
        }

        DB::transaction(function () use ($groupChat) {
            // Delete media from storage
            $messages = $groupChat->messages()->with('media')->get();
            foreach ($messages as $message) {
                foreach ($message->media as $media) {
                    $disk = $media->disk ?? config('filesystems.default');
                    Storage::disk($disk)->delete($media->file_path);
                    $media->delete();
                }
            }

            $groupChat->messages()->delete();
            $groupChat->members()->detach();
            $groupChat->delete();
        });

        return redirect()->route('chat.getUserChats');
    }

    public function leave(GroupChat $groupChat): RedirectResponse
    {
        $user = Auth::user();
        $groupChat->members()->detach($user->id);

        if ($groupChat->members()->count() === 0) {
            DB::transaction(function () use ($groupChat) {
                $messages = $groupChat->messages()->with('media')->get();
                foreach ($messages as $message) {
                    foreach ($message->media as $media) {
                        $disk = $media->disk ?? config('filesystems.default');
                        Storage::disk($disk)->delete($media->file_path);
                        $media->delete();
                    }
                }
                $groupChat->messages()->delete();
                $groupChat->delete();
            });
        }

        return redirect()->route('chat.getUserChats');
    }
}
