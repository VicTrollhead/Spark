<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MigrationRollbackTest extends TestCase
{
    public function test_can_migrate_and_rollback_all_migrations(): void
    {
        Artisan::call('migrate:fresh');
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('posts'));
        $this->assertTrue(Schema::hasTable('comments'));
        $this->assertTrue(Schema::hasTable('follows'));
        $this->assertTrue(Schema::hasTable('likes'));
        $this->assertTrue(Schema::hasTable('media'));
        $this->assertTrue(Schema::hasTable('favorites'));
        $this->assertTrue(Schema::hasTable('hashtags'));
        $this->assertTrue(Schema::hasTable('reposts'));
        $this->assertTrue(Schema::hasTable('chats'));
        $this->assertTrue(Schema::hasTable('messages'));
        $this->assertTrue(Schema::hasTable('notifications'));
        $this->assertTrue(Schema::hasTable('polls'));
        $this->assertTrue(Schema::hasTable('poll_options'));
        $this->assertTrue(Schema::hasTable('poll_votes'));
        $this->assertTrue(Schema::hasTable('group_chats'));

        Artisan::call('migrate:rollback', ['--step' => 30]);

        $this->assertFalse(Schema::hasTable('posts'));
        $this->assertFalse(Schema::hasTable('comments'));
        $this->assertFalse(Schema::hasTable('follows'));

        Artisan::call('migrate');
    }

    public function test_can_rollback_and_rerun_latest_migration_batch(): void
    {
        Artisan::call('migrate:fresh');
        Artisan::call('migrate:rollback', ['--step' => 1]);
        Artisan::call('migrate');

        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('posts'));
        $this->assertTrue(Schema::hasTable('polls'));
    }

    public function test_can_run_migrate_refresh_without_errors(): void
    {
        $exitCode = Artisan::call('migrate:refresh');
        $this->assertEquals(0, $exitCode);
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('posts'));
    }
}
