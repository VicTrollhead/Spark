<?php

namespace Tests\Feature;

use App\Models\Hashtag;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_page_loads()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/search');

        $response->assertOk();
    }

    public function test_search_posts_by_content()
    {
        $user = User::factory()->create();
        Post::factory()->create([
            'content' => 'Laravel is awesome',
            'is_private' => false,
        ]);
        Post::factory()->create([
            'content' => 'React is cool',
            'is_private' => false,
        ]);

        $response = $this->actingAs($user)->get('/search?q=Laravel&tab=posts');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('search')
            ->where('query', 'Laravel')
            ->has('posts', 1)
        );
    }

    public function test_search_users_by_name()
    {
        $user = User::factory()->create();
        User::factory()->create(['name' => 'John Doe', 'username' => 'johndoe']);
        User::factory()->create(['name' => 'Jane Smith', 'username' => 'janesmith']);

        $response = $this->actingAs($user)->get('/search?q=John&tab=users');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('search')
            ->has('users', 1)
        );
    }

    public function test_search_hashtags()
    {
        $user = User::factory()->create();
        $hashtag = Hashtag::create(['hashtag' => 'laravel']);
        $post = Post::factory()->create(['is_private' => false]);
        $post->hashtags()->attach($hashtag->id);

        $response = $this->actingAs($user)->get('/search?q=laravel&tab=hashtags');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('search')
            ->has('hashtags', 1)
        );
    }

    public function test_empty_search_returns_no_results()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/search?q=&tab=posts');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('search')
            ->has('posts', 0)
        );
    }

    public function test_private_posts_not_in_search_for_non_follower()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Post::factory()->create([
            'user_id' => $otherUser->id,
            'content' => 'Secret keyword',
            'is_private' => true,
        ]);

        $response = $this->actingAs($user)->get('/search?q=Secret&tab=posts');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('search')
            ->has('posts', 0)
        );
    }

    public function test_guest_cannot_search()
    {
        $response = $this->get('/search?q=test');

        $response->assertRedirect('/login');
    }
}
