<?php

namespace Tests\Feature;

use App\Models\Poll;
use App\Models\PollOption;
use App\Models\PollVote;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PollTest extends TestCase
{
    use RefreshDatabase;

    private function createPollWithOptions(): array
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);
        $poll = Poll::create([
            'post_id' => $post->id,
            'expires_at' => now()->addDay(),
        ]);
        $option1 = PollOption::create(['poll_id' => $poll->id, 'text' => 'Option A']);
        $option2 = PollOption::create(['poll_id' => $poll->id, 'text' => 'Option B']);

        return compact('user', 'post', 'poll', 'option1', 'option2');
    }

    public function test_user_can_vote_on_poll()
    {
        $data = $this->createPollWithOptions();
        $voter = User::factory()->create();

        $response = $this->actingAs($voter)->post("/poll/{$data['poll']->id}/vote", [
            'option_id' => $data['option1']->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('poll_votes', [
            'poll_id' => $data['poll']->id,
            'poll_option_id' => $data['option1']->id,
            'user_id' => $voter->id,
        ]);
    }

    public function test_user_can_change_vote()
    {
        $data = $this->createPollWithOptions();
        $voter = User::factory()->create();

        $this->actingAs($voter)->post("/poll/{$data['poll']->id}/vote", [
            'option_id' => $data['option1']->id,
        ]);

        $this->actingAs($voter)->post("/poll/{$data['poll']->id}/vote", [
            'option_id' => $data['option2']->id,
        ]);

        $this->assertEquals(1, PollVote::where('user_id', $voter->id)->where('poll_id', $data['poll']->id)->count());
        $this->assertDatabaseHas('poll_votes', [
            'poll_id' => $data['poll']->id,
            'poll_option_id' => $data['option2']->id,
            'user_id' => $voter->id,
        ]);
    }

    public function test_cannot_vote_on_expired_poll()
    {
        $data = $this->createPollWithOptions();
        $data['poll']->update(['expires_at' => now()->subHour()]);
        $voter = User::factory()->create();

        $response = $this->actingAs($voter)->post("/poll/{$data['poll']->id}/vote", [
            'option_id' => $data['option1']->id,
        ]);

        $response->assertSessionHasErrors('poll');
        $this->assertDatabaseMissing('poll_votes', [
            'user_id' => $voter->id,
            'poll_id' => $data['poll']->id,
        ]);
    }

    public function test_vote_requires_valid_option()
    {
        $data = $this->createPollWithOptions();
        $voter = User::factory()->create();

        $response = $this->actingAs($voter)->post("/poll/{$data['poll']->id}/vote", [
            'option_id' => 9999,
        ]);

        $response->assertSessionHasErrors('option_id');
    }

    public function test_guest_cannot_vote()
    {
        $data = $this->createPollWithOptions();

        $response = $this->post("/poll/{$data['poll']->id}/vote", [
            'option_id' => $data['option1']->id,
        ]);

        $response->assertRedirect('/login');
    }
}
