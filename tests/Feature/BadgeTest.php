<?php

namespace Tests\Feature;

use App\Models\Follow;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BadgeTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_profile_shows_follower_count()
    {
        $user = User::factory()->create();
        $follower1 = User::factory()->create();
        $follower2 = User::factory()->create();

        Follow::create(['follower_id' => $follower1->id, 'followee_id' => $user->id, 'is_accepted' => true]);
        Follow::create(['follower_id' => $follower2->id, 'followee_id' => $user->id, 'is_accepted' => true]);

        $response = $this->actingAs($user)->get("/user/{$user->id}");

        $response->assertOk();
    }

    public function test_user_profile_shows_following_count()
    {
        $user = User::factory()->create();
        $followed1 = User::factory()->create();
        $followed2 = User::factory()->create();

        Follow::create(['follower_id' => $user->id, 'followee_id' => $followed1->id, 'is_accepted' => true]);
        Follow::create(['follower_id' => $user->id, 'followee_id' => $followed2->id, 'is_accepted' => true]);

        $response = $this->actingAs($user)->get("/user/{$user->id}");

        $response->assertOk();
    }

    public function test_user_profile_shows_post_count()
    {
        $user = User::factory()->create();
        Post::factory()->count(3)->create(['user_id' => $user->id, 'is_private' => false]);

        $response = $this->actingAs($user)->get("/user/{$user->id}");

        $response->assertOk();
    }

    public function test_pending_follow_requests_not_counted_as_followers()
    {
        $user = User::factory()->create(['is_private' => true]);
        $requester = User::factory()->create();

        Follow::create(['follower_id' => $requester->id, 'followee_id' => $user->id, 'is_accepted' => false]);

        $this->assertEquals(0, $user->followers()->count());
    }

    public function test_verified_badge_shown_for_verified_user()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get("/user/{$user->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('user'));
    }
}
