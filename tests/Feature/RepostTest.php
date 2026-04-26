<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Repost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RepostTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_repost_public_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['is_private' => false]);

        $response = $this->actingAs($user)->post("/post/{$post->id}/repost");

        $response->assertRedirect();
        $this->assertDatabaseHas('reposts', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_user_cannot_repost_private_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['is_private' => true]);

        $response = $this->actingAs($user)->post("/post/{$post->id}/repost");

        $response->assertForbidden();
        $this->assertDatabaseMissing('reposts', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_user_can_undo_repost()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['is_private' => false]);

        Repost::create([
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        $response = $this->actingAs($user)->post("/post/{$post->id}/undo");

        $response->assertRedirect();
        $this->assertDatabaseMissing('reposts', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_repost_is_idempotent()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['is_private' => false]);

        $this->actingAs($user)->post("/post/{$post->id}/repost");
        $this->actingAs($user)->post("/post/{$post->id}/repost");

        $this->assertEquals(1, Repost::where('user_id', $user->id)->where('post_id', $post->id)->count());
    }

    public function test_repost_creates_notification()
    {
        $author = User::factory()->create();
        $reposter = User::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $author->id,
            'is_private' => false,
        ]);

        $this->actingAs($reposter)->post("/post/{$post->id}/repost");

        $this->assertDatabaseHas('notifications', [
            'user_id' => $author->id,
            'source_user_id' => $reposter->id,
            'type' => 'repost',
            'post_id' => $post->id,
        ]);
    }

    public function test_reposting_own_post_no_notification()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $user->id,
            'is_private' => false,
        ]);

        $this->actingAs($user)->post("/post/{$post->id}/repost");

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $user->id,
            'source_user_id' => $user->id,
            'type' => 'repost',
        ]);
    }

    public function test_guest_cannot_repost()
    {
        $post = Post::factory()->create(['is_private' => false]);

        $response = $this->post("/post/{$post->id}/repost");

        $response->assertRedirect('/login');
    }
}
