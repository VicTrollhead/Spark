<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_participant_can_send_message()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $chat = Chat::firstOrCreateChat($user1->id, $user2->id);

        $response = $this->actingAs($user1)->post('/chat/user-chat/post-message', [
            'chatId' => $chat->id,
            'text' => 'Hello!',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('messages', [
            'chat_id' => $chat->id,
            'user_id' => $user1->id,
            'text' => 'Hello!',
        ]);
    }

    public function test_non_participant_cannot_send_message_to_chat()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $attacker = User::factory()->create();
        $chat = Chat::firstOrCreateChat($user1->id, $user2->id);

        $this->actingAs($attacker)
            ->post('/chat/user-chat/post-message', [
                'chatId' => $chat->id,
                'text' => 'Sneaky message',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('messages', [
            'chat_id' => $chat->id,
            'user_id' => $attacker->id,
        ]);
    }

    public function test_user_can_delete_own_message()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $chat = Chat::firstOrCreateChat($user1->id, $user2->id);

        $message = Message::create([
            'user_id' => $user1->id,
            'chat_id' => $chat->id,
            'text' => 'Delete me',
        ]);

        $this->actingAs($user1)
            ->delete("/chat/message/{$message->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('messages', ['id' => $message->id]);
    }

    public function test_user_cannot_delete_others_message()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $chat = Chat::firstOrCreateChat($user1->id, $user2->id);

        $message = Message::create([
            'user_id' => $user1->id,
            'chat_id' => $chat->id,
            'text' => 'My message',
        ]);

        $this->actingAs($user2)
            ->delete("/chat/message/{$message->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('messages', ['id' => $message->id]);
    }

    public function test_user_cannot_create_chat_with_self()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post("/chat/user-chat/new/{$user->id}")
            ->assertStatus(400);
    }

    public function test_message_text_is_validated()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $chat = Chat::firstOrCreateChat($user1->id, $user2->id);

        // Empty text
        $this->actingAs($user1)
            ->post('/chat/user-chat/post-message', [
                'chatId' => $chat->id,
                'text' => '',
            ])
            ->assertSessionHasErrors('text');

        // Too long text
        $this->actingAs($user1)
            ->post('/chat/user-chat/post-message', [
                'chatId' => $chat->id,
                'text' => str_repeat('a', 1001),
            ])
            ->assertSessionHasErrors('text');
    }

    public function test_guest_cannot_access_chat()
    {
        $this->get('/chat/everyone')->assertRedirect('/login');
        $this->get('/chat/user-chats')->assertRedirect('/login');
    }
}
