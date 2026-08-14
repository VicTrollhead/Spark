<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\CommentCreated;
use App\Http\Requests\StoreCommentRequest;
use App\Models\Comment;
use App\Models\Notification;
use App\Models\Post;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;

class CommentController extends Controller
{
    public function store(StoreCommentRequest $request, Post $post): RedirectResponse
    {
        if (Gate::denies('view', $post)) {
            abort(403, 'You cannot comment on this post.');
        }

        $request->validated();

        // Flatten deep replies: if replying to a reply, attach to the root-level parent instead
        $parentCommentId = $request['parent_comment_id'];
        $replyTargetComment = null;
        if ($parentCommentId) {
            $replyTargetComment = Comment::find($parentCommentId);
            if ($replyTargetComment && $replyTargetComment->parent_comment_id) {
                // This is a reply-to-reply — flatten to the top-level parent
                $parentCommentId = $replyTargetComment->parent_comment_id;
            }
        }

        $comment = Comment::create([
            'user_id' => Auth::id(),
            'post_id' => $request['post_id'],
            'parent_comment_id' => $parentCommentId,
            'content' => $request['content'],
        ]);

        if ($post->user_id !== Auth::id()) {
            NotificationService::create([
                'user_id' => $post->user_id,
                'source_user_id' => Auth::id(),
                'type' => 'comment',
                'post_id' => $post->id,
                'extra_data' => $comment->content,
                'comment_id' => $comment->id,
            ]);
        }

        // Notify the comment author being replied to
        if ($replyTargetComment && $replyTargetComment->user_id !== Auth::id() && $replyTargetComment->user_id !== $post->user_id) {
            NotificationService::create([
                'user_id' => $replyTargetComment->user_id,
                'source_user_id' => Auth::id(),
                'type' => 'comment_reply',
                'post_id' => $post->id,
                'extra_data' => $comment->content,
                'comment_id' => $comment->id,
            ]);
        }

        if ($comment->content) {
            notifyMentionedUsers($comment->content, Auth::id(), $post->id, $comment->id);
        }

        event(new CommentCreated($comment));

        return redirect()->back()->with('success', 'Comment added successfully.');
    }

    public function destroy(Comment $comment): RedirectResponse
    {
        if (Auth::id() !== $comment->user_id) {
            return Redirect::back()->with(['error' => 'Unauthorized'], 403);
        }

        Notification::whereIn('type', ['comment', 'comment_reply', 'mention'])
            ->where('source_user_id', $comment->user_id)
            ->where('comment_id', $comment->id)
            ->delete();

        $comment->delete();

        return redirect()->back()->with(['message' => 'Comment deleted successfully']);
    }
}
