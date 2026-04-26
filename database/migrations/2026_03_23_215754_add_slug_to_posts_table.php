<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('slug', 12)->nullable()->after('id');
        });

        // Generate slugs for all existing posts
        DB::table('posts')->orderBy('id')->each(function ($post) {
            $slug = $this->generateUniqueSlug();
            DB::table('posts')->where('id', $post->id)->update(['slug' => $slug]);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->string('slug', 12)->nullable(false)->unique()->change();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }

    private function generateUniqueSlug(): string
    {
        do {
            $slug = Str::random(10);
        } while (DB::table('posts')->where('slug', $slug)->exists());

        return $slug;
    }
};
