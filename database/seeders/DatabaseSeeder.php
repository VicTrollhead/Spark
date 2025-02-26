<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Users
        $users = User::factory()->count(20)->create();

        // Create Posts
        $posts = Post::factory()
            ->count(10)
            ->make()
            ->each(function ($post) use ($users) {
                $post->user_id = $users->random()->id;
                $post->save();
            });

        // Create Follows (Ensure no user follows themselves)
        $users->each(function ($follower) use ($users) {
            $users->random(rand(1, 5))->each(function ($followee) use ($follower, $users) {
                if ($follower->id !== $followee->id) {
                    Follow::factory()->create([
                        'follower_id' => $follower->id,
                        'followee_id' => $followee->id,
                    ]);
                }
            });
        });

        // Create Likes
        $users->each(function ($user) use ($posts) {
            $posts->random(rand(1, 10))->each(function ($post) use ($user) {
                Like::factory()->create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                ]);
            });
        });

        // Create Comments
        $users->each(function ($user) use ($posts, $users) {
            $posts->random(rand(1, 5))->each(function ($post) use ($user, $users) {
                $comment = Comment::factory()->create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                ]);

                // Nested Replies
                if (rand(0, 1)) {
                    Comment::factory()->create([
                        'user_id' => $users->random()->id,
                        'post_id' => $post->id,
                        'parent_comment_id' => $comment->id,
                    ]);
                }
            });
        });
    }
}
