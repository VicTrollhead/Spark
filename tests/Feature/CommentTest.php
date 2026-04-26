<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_comment_on_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['is_private' => false]);

        $response = $this->actingAs($user)->post("/post/{$post->id}/comment", [
            'post_id' => $post->id,
            'content' => 'Great post!',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comments', [
            'user_id' => $user->id,
            'post_id' => $post->id,
            'content' => 'Great post!',
        ]);
    }

    public function test_comment_requires_content()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $response = $this->actingAs($user)->post("/post/{$post->id}/comment", [
            'post_id' => $post->id,
            'content' => '',
        ]);

        $response->assertSessionHasErrors('content');
    }

    public function test_comment_content_max_length()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $response = $this->actingAs($user)->post("/post/{$post->id}/comment", [
            'post_id' => $post->id,
            'content' => str_repeat('a', 301),
        ]);

        $response->assertSessionHasErrors('content');
    }

    public function test_user_can_delete_own_comment()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        $comment = Comment::factory()->create([
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        $response = $this->actingAs($user)->post("/comment/{$comment->id}/delete");

        $response->assertRedirect();
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_user_cannot_delete_others_comment()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::factory()->create();
        $comment = Comment::factory()->create([
            'user_id' => $otherUser->id,
            'post_id' => $post->id,
        ]);

        $response = $this->actingAs($user)->post("/comment/{$comment->id}/delete");

        $this->assertDatabaseHas('comments', ['id' => $comment->id]);
    }

    public function test_reply_to_comment()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        $parentComment = Comment::factory()->create([
            'post_id' => $post->id,
        ]);

        $response = $this->actingAs($user)->post("/post/{$post->id}/comment", [
            'post_id' => $post->id,
            'content' => 'This is a reply',
            'parent_comment_id' => $parentComment->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comments', [
            'user_id' => $user->id,
            'post_id' => $post->id,
            'parent_comment_id' => $parentComment->id,
            'content' => 'This is a reply',
        ]);
    }

    public function test_guest_cannot_comment()
    {
        $post = Post::factory()->create();

        $response = $this->post("/post/{$post->id}/comment", [
            'post_id' => $post->id,
            'content' => 'Hello',
        ]);

        $response->assertRedirect('/login');
    }

    public function test_comment_creates_notification_for_post_author()
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $author->id]);

        $this->actingAs($commenter)->post("/post/{$post->id}/comment", [
            'post_id' => $post->id,
            'content' => 'Nice one!',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $author->id,
            'source_user_id' => $commenter->id,
            'type' => 'comment',
            'post_id' => $post->id,
        ]);
    }

    public function test_commenting_on_own_post_does_not_create_notification()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->post("/post/{$post->id}/comment", [
            'post_id' => $post->id,
            'content' => 'Self comment',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $user->id,
            'source_user_id' => $user->id,
            'type' => 'comment',
        ]);
    }
}
