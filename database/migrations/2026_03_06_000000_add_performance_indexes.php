<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'is_read']);
            $table->index(['type', 'source_user_id', 'message_id']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index(['chat_id', 'read_at']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->index('is_private');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_read']);
            $table->dropIndex(['type', 'source_user_id', 'message_id']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['chat_id', 'read_at']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['is_private']);
        });
    }
};
