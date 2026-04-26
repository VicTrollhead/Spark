<?php

namespace Tests\Feature;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_follow_public_user()
    {
        $follower = User::factory()->create();
        $followee = User::factory()->create(['is_private' => false]);

        $response = $this->actingAs($follower)->post("/user/{$followee->id}/follow");

        $response->assertRedirect();
        $this->assertDatabaseHas('follows', [
            'follower_id' => $follower->id,
            'followee_id' => $followee->id,
            'is_accepted' => true,
        ]);
    }

    public function test_following_private_user_creates_pending_request()
    {
        $follower = User::factory()->create();
        $followee = User::factory()->create(['is_private' => true]);

        $response = $this->actingAs($follower)->post("/user/{$followee->id}/follow");

        $response->assertRedirect();
        $this->assertDatabaseHas('follows', [
            'follower_id' => $follower->id,
            'followee_id' => $followee->id,
            'is_accepted' => false,
        ]);
    }

    public function test_user_cannot_follow_self()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post("/user/{$user->id}/follow");

        $response->assertRedirect();
        $this->assertDatabaseMissing('follows', [
            'follower_id' => $user->id,
            'followee_id' => $user->id,
        ]);
    }

    public function test_user_can_unfollow()
    {
        $follower = User::factory()->create();
        $followee = User::factory()->create();

        Follow::create([
            'follower_id' => $follower->id,
            'followee_id' => $followee->id,
            'is_accepted' => true,
        ]);

        $response = $this->actingAs($follower)->post("/user/{$followee->id}/unfollow");

        $response->assertRedirect();
        $this->assertDatabaseMissing('follows', [
            'follower_id' => $follower->id,
            'followee_id' => $followee->id,
        ]);
    }

    public function test_cannot_follow_same_user_twice()
    {
        $follower = User::factory()->create();
        $followee = User::factory()->create(['is_private' => false]);

        $this->actingAs($follower)->post("/user/{$followee->id}/follow");
        $this->actingAs($follower)->post("/user/{$followee->id}/follow");

        $this->assertEquals(1, Follow::where('follower_id', $follower->id)->where('followee_id', $followee->id)->count());
    }

    public function test_follow_creates_notification()
    {
        $follower = User::factory()->create();
        $followee = User::factory()->create(['is_private' => false]);

        $this->actingAs($follower)->post("/user/{$followee->id}/follow");

        $this->assertDatabaseHas('notifications', [
            'user_id' => $followee->id,
            'source_user_id' => $follower->id,
            'type' => 'follow',
        ]);
    }

    public function test_is_following_endpoint()
    {
        $follower = User::factory()->create();
        $followee = User::factory()->create();

        Follow::create([
            'follower_id' => $follower->id,
            'followee_id' => $followee->id,
            'is_accepted' => true,
        ]);

        $response = $this->actingAs($follower)->get("/is-following/{$followee->id}");

        $response->assertOk();
        $response->assertJson(['following' => true]);
    }

    public function test_is_not_following_endpoint()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $response = $this->actingAs($user1)->get("/is-following/{$user2->id}");

        $response->assertOk();
        $response->assertJson(['following' => false]);
    }

    public function test_guest_cannot_follow()
    {
        $user = User::factory()->create();

        $response = $this->post("/user/{$user->id}/follow");

        $response->assertRedirect('/login');
    }
}
