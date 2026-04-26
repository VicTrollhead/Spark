<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PinPostTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_pin_own_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->post("/post/{$post->id}/toggle-pin");

        $response->assertRedirect();
        $user->refresh();
        $this->assertEquals($post->id, $user->pinned_post_id);
    }

    public function test_user_can_unpin_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $user->update(['pinned_post_id' => $post->id]);

        $response = $this->actingAs($user)->post("/post/{$post->id}/toggle-pin");

        $response->assertRedirect();
        $user->refresh();
        $this->assertNull($user->pinned_post_id);
    }

    public function test_user_cannot_pin_others_post()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->post("/post/{$post->id}/toggle-pin");

        $response->assertForbidden();
        $user->refresh();
        $this->assertNull($user->pinned_post_id);
    }

    public function test_pinning_new_post_replaces_old_pin()
    {
        $user = User::factory()->create();
        $post1 = Post::factory()->create(['user_id' => $user->id]);
        $post2 = Post::factory()->create(['user_id' => $user->id]);

        $user->update(['pinned_post_id' => $post1->id]);

        $this->actingAs($user)->post("/post/{$post2->id}/toggle-pin");

        $user->refresh();
        $this->assertEquals($post2->id, $user->pinned_post_id);
    }

    public function test_guest_cannot_pin()
    {
        $post = Post::factory()->create();

        $response = $this->post("/post/{$post->id}/toggle-pin");

        $response->assertRedirect('/login');
    }
}
