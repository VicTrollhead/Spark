<?php

namespace Tests\Feature;

use App\Models\Favorite;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoriteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_favorite_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $response = $this->actingAs($user)->post("/post/{$post->slug}/add-favorite");

        $response->assertRedirect();
        $this->assertDatabaseHas('favorites', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_user_can_remove_favorite()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        Favorite::create([
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        $response = $this->actingAs($user)->post("/post/{$post->slug}/remove-favorite");

        $response->assertRedirect();
        $this->assertDatabaseMissing('favorites', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_favorite_is_idempotent()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user)->post("/post/{$post->slug}/add-favorite");
        $this->actingAs($user)->post("/post/{$post->slug}/add-favorite");

        $this->assertEquals(1, Favorite::where('user_id', $user->id)->where('post_id', $post->id)->count());
    }

    public function test_favorite_creates_notification()
    {
        $author = User::factory()->create();
        $favoriter = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $author->id]);

        $this->actingAs($favoriter)->post("/post/{$post->slug}/add-favorite");

        $this->assertDatabaseHas('notifications', [
            'user_id' => $author->id,
            'source_user_id' => $favoriter->id,
            'type' => 'favorite',
            'post_id' => $post->id,
        ]);
    }

    public function test_favoriting_own_post_no_notification()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->post("/post/{$post->slug}/add-favorite");

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $user->id,
            'source_user_id' => $user->id,
            'type' => 'favorite',
        ]);
    }

    public function test_remove_favorite_removes_notification()
    {
        $author = User::factory()->create();
        $favoriter = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $author->id]);

        $this->actingAs($favoriter)->post("/post/{$post->slug}/add-favorite");
        $this->actingAs($favoriter)->post("/post/{$post->slug}/remove-favorite");

        $this->assertDatabaseMissing('notifications', [
            'source_user_id' => $favoriter->id,
            'type' => 'favorite',
            'post_id' => $post->id,
        ]);
    }

    public function test_guest_cannot_favorite()
    {
        $post = Post::factory()->create();

        $response = $this->post("/post/{$post->slug}/add-favorite");

        $response->assertRedirect('/login');
    }
}
