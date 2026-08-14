<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_dashboard()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_dashboard()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertOk();
    }

    public function test_dashboard_returns_paginated_posts()
    {
        $user = User::factory()->create();
        Post::factory()->count(20)->create(['is_private' => false]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard', false)
            ->has('posts.data', 15)
            ->has('posts.next_page_url')
        );
    }

    public function test_user_can_create_post()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/dashboard', [
            'content' => 'Hello world!',
            'is_private' => false,
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertDatabaseHas('posts', [
            'user_id' => $user->id,
            'content' => 'Hello world!',
            'is_private' => false,
        ]);
    }

    public function test_user_can_create_private_post()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/dashboard', [
            'content' => 'Secret post',
            'is_private' => true,
        ]);

        $this->assertDatabaseHas('posts', [
            'user_id' => $user->id,
            'content' => 'Secret post',
            'is_private' => true,
        ]);
    }

    public function test_user_can_create_post_with_hashtags()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/dashboard', [
            'content' => 'Post with tags',
            'is_private' => false,
            'hashtags' => ['#laravel', '#php'],
        ]);

        $post = Post::where('user_id', $user->id)->first();
        $this->assertNotNull($post);
        $this->assertCount(2, $post->hashtags);
        $this->assertTrue($post->hashtags->contains('hashtag', 'laravel'));
        $this->assertTrue($post->hashtags->contains('hashtag', 'php'));
    }

    public function test_post_content_max_length_validated()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/dashboard', [
            'content' => str_repeat('a', 1001),
            'is_private' => false,
        ]);

        $response->assertSessionHasErrors('content');
    }

    public function test_user_can_view_own_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get("/post/{$post->slug}")
            ->assertOk();
    }

    public function test_user_can_view_public_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['is_private' => false]);

        $this->actingAs($user)
            ->get("/post/{$post->slug}")
            ->assertOk();
    }

    public function test_user_cannot_view_others_private_post()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $otherUser->id,
            'is_private' => true,
        ]);

        $this->actingAs($user)
            ->get("/post/{$post->slug}")
            ->assertForbidden();
    }

    public function test_follower_can_view_private_post()
    {
        $author = User::factory()->create(['is_private' => false]);
        $follower = User::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $author->id,
            'is_private' => true,
        ]);

        // Create follow relationship
        $author->followers()->attach($follower->id, ['is_accepted' => true]);

        $this->actingAs($follower)
            ->get("/post/{$post->slug}")
            ->assertOk();
    }

    public function test_user_can_delete_own_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->delete("/post/{$post->slug}");

        $response->assertRedirect(route('dashboard'));
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_user_cannot_delete_others_post()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $this->actingAs($user)
            ->delete("/post/{$post->slug}")
            ->assertForbidden();

        $this->assertDatabaseHas('posts', ['id' => $post->id]);
    }

    public function test_user_can_update_own_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $user->id,
            'content' => 'Original content',
        ]);

        $response = $this->actingAs($user)->patch("/post/{$post->slug}/update", [
            'content' => 'Updated content',
            'is_private' => false,
        ]);

        $response->assertRedirect(route('post.show', $post));
        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'content' => 'Updated content',
        ]);
    }

    public function test_user_cannot_update_others_post()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $otherUser->id,
            'content' => 'Original',
        ]);

        $this->actingAs($user)
            ->patch("/post/{$post->slug}/update", [
                'content' => 'Hacked!',
                'is_private' => false,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'content' => 'Original',
        ]);
    }

    public function test_private_posts_hidden_from_non_followers_on_dashboard()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Post::factory()->create([
            'user_id' => $otherUser->id,
            'is_private' => true,
            'content' => 'Secret content',
        ]);
        Post::factory()->create([
            'user_id' => $otherUser->id,
            'is_private' => false,
            'content' => 'Public content',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertInertia(fn ($page) => $page
            ->component('dashboard', false)
            ->has('posts.data', 1)
        );
    }

    public function test_own_private_posts_visible_on_dashboard()
    {
        $user = User::factory()->create();

        Post::factory()->create([
            'user_id' => $user->id,
            'is_private' => true,
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertInertia(fn ($page) => $page
            ->component('dashboard', false)
            ->has('posts.data', 1)
        );
    }
}
