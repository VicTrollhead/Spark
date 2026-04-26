<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_mark_own_notification_as_read()
    {
        $user = User::factory()->create();
        $sourceUser = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'like',
            'is_read' => false,
        ]);

        $this->actingAs($user)
            ->patch("/notifications/{$notification->id}/read")
            ->assertRedirect();

        $this->assertTrue($notification->fresh()->is_read);
    }

    public function test_user_cannot_mark_others_notification_as_read()
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $sourceUser = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $owner->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'like',
            'is_read' => false,
        ]);

        $this->actingAs($attacker)
            ->patch("/notifications/{$notification->id}/read")
            ->assertForbidden();

        $this->assertFalse($notification->fresh()->is_read);
    }

    public function test_user_can_mark_own_notification_as_unread()
    {
        $user = User::factory()->create();
        $sourceUser = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $user->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'like',
            'is_read' => true,
        ]);

        $this->actingAs($user)
            ->patch("/notifications/{$notification->id}/unread")
            ->assertRedirect();

        $this->assertFalse($notification->fresh()->is_read);
    }

    public function test_user_cannot_mark_others_notification_as_unread()
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $sourceUser = User::factory()->create();

        $notification = Notification::create([
            'user_id' => $owner->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'like',
            'is_read' => true,
        ]);

        $this->actingAs($attacker)
            ->patch("/notifications/{$notification->id}/unread")
            ->assertForbidden();

        $this->assertTrue($notification->fresh()->is_read);
    }

    public function test_mark_all_as_read_only_affects_own_notifications()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $sourceUser = User::factory()->create();

        Notification::create([
            'user_id' => $user->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'like',
            'is_read' => false,
        ]);

        $otherNotification = Notification::create([
            'user_id' => $otherUser->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'like',
            'is_read' => false,
        ]);

        $this->actingAs($user)
            ->patch('/notifications/mark-all-read')
            ->assertRedirect();

        // Own notifications marked as read
        $this->assertEquals(0, Notification::where('user_id', $user->id)->where('is_read', false)->count());
        // Other user's notifications unaffected
        $this->assertFalse($otherNotification->fresh()->is_read);
    }

    public function test_guest_cannot_access_notifications()
    {
        $this->get('/user/notifications')->assertRedirect('/login');
    }

    public function test_unread_count_returns_only_own_notifications()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $sourceUser = User::factory()->create();

        Notification::create([
            'user_id' => $user->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'like',
            'is_read' => false,
        ]);
        Notification::create([
            'user_id' => $user->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'follow',
            'is_read' => false,
        ]);
        Notification::create([
            'user_id' => $otherUser->id,
            'source_user_id' => $sourceUser->id,
            'type' => 'like',
            'is_read' => false,
        ]);

        $response = $this->actingAs($user)
            ->get('/notifications/unread-count');

        $response->assertOk();
        $response->assertJson(['unread_count' => 2]);
    }
}
