<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_chats', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('group_chat_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_chat_id')->constrained('group_chats')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['group_chat_id', 'user_id']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('group_chat_id')->nullable()->after('chat_id')->constrained('group_chats')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['group_chat_id']);
            $table->dropColumn('group_chat_id');
        });

        Schema::dropIfExists('group_chat_user');
        Schema::dropIfExists('group_chats');
    }
};
