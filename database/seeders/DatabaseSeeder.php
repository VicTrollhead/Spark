<?php

namespace Database\Seeders;

use App\Models\Chat;
use App\Models\Comment;
use App\Models\Favorite;
use App\Models\Follow;
use App\Models\GroupChat;
use App\Models\Hashtag;
use App\Models\Like;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Poll;
use App\Models\PollOption;
use App\Models\PollVote;
use App\Models\Post;
use App\Models\Repost;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ── 1. USERS ──────────────────────────────────────────────

        // Debug superuser — verified, all privileges, public
        $superUser = User::create([
            'username' => 'superuser',
            'email' => 'test@fake.com',
            'password' => Hash::make('12345678'),
            'name' => 'Super User',
            'bio' => 'Debug superuser account for development.',
            'location' => 'Everywhere',
            'website' => 'https://example.com',
            'date_of_birth' => '1990-01-01',
            'is_verified' => true,
            'email_verified_at' => now(),
            'is_private' => false,
            'status' => 'active',
        ]);

        // Standard debug user
        $paragon = User::create([
            'username' => 'paragon',
            'email' => 'yariyclasher16@gmail.com',
            'password' => Hash::make('11111111'),
            'name' => 'Paragon',
            'bio' => 'Standard test account for development.',
            'location' => 'Nowhere',
            'website' => 'https://example.com',
            'date_of_birth' => '2000-01-01',
            'is_verified' => false,
            'email_verified_at' => now(),
            'is_private' => false,
            'status' => 'active',
        ]);

        // 30 regular users — mostly active, a few private, all email-verified
        $users = User::factory()
            ->count(30)
            ->sequence(fn ($seq) => [
                'status' => $seq->index < 28 ? 'active' : 'suspended',
                'is_private' => $seq->index >= 25, // last 5 are private
                'is_verified' => $seq->index < 5,  // first 5 verified
            ])
            ->create();

        $allUsers = $users->prepend($paragon)->prepend($superUser); // 32 total

        // ── 2. HASHTAGS ───────────────────────────────────────────

        $hashtagNames = [
            'webdev', 'laravel', 'react', 'javascript', 'php',
            'coding', 'opensource', 'tech', 'startup', 'ai',
            'design', 'css', 'typescript', 'devops', 'linux',
            'python', 'docker', 'vim', 'rust', 'gaming',
        ];

        $hashtags = collect($hashtagNames)->map(fn ($tag) =>
            Hashtag::create(['hashtag' => $tag])
        );

        // ── 3. FOLLOW GRAPH ───────────────────────────────────────

        // Everyone follows superuser and paragon
        $users->each(function ($user) use ($superUser, $paragon) {
            Follow::firstOrCreate(
                ['follower_id' => $user->id, 'followee_id' => $superUser->id],
                ['is_accepted' => true]
            );
            Follow::firstOrCreate(
                ['follower_id' => $user->id, 'followee_id' => $paragon->id],
                ['is_accepted' => true]
            );
        });

        // Superuser and paragon follow each other
        Follow::firstOrCreate(['follower_id' => $superUser->id, 'followee_id' => $paragon->id], ['is_accepted' => true]);
        Follow::firstOrCreate(['follower_id' => $paragon->id, 'followee_id' => $superUser->id], ['is_accepted' => true]);

        // Superuser follows ~15 users back
        $users->random(15)->each(function ($user) use ($superUser) {
            Follow::firstOrCreate(
                ['follower_id' => $superUser->id, 'followee_id' => $user->id],
                ['is_accepted' => true]
            );
        });

        // Paragon follows ~10 users back
        $users->random(10)->each(function ($user) use ($paragon) {
            Follow::firstOrCreate(
                ['follower_id' => $paragon->id, 'followee_id' => $user->id],
                ['is_accepted' => true]
            );
        });

        // Random follow graph between users
        $users->each(function ($follower) use ($users) {
            $toFollow = $users->where('id', '!=', $follower->id)
                ->random(rand(3, 12));

            $toFollow->each(function ($followee) use ($follower) {
                $exists = Follow::where('follower_id', $follower->id)
                    ->where('followee_id', $followee->id)
                    ->exists();

                if (! $exists) {
                    Follow::create([
                        'follower_id' => $follower->id,
                        'followee_id' => $followee->id,
                        'is_accepted' => $followee->is_private ? fake()->boolean(70) : true,
                    ]);
                }
            });
        });

        // A few pending follow requests to private accounts
        $privateUsers = $users->where('is_private', true);
        $publicUsers = $users->where('is_private', false);

        $privateUsers->each(function ($private) use ($publicUsers) {
            $publicUsers->random(min(3, $publicUsers->count()))->each(function ($pub) use ($private) {
                $exists = Follow::where('follower_id', $pub->id)
                    ->where('followee_id', $private->id)
                    ->exists();

                if (! $exists) {
                    Follow::create([
                        'follower_id' => $pub->id,
                        'followee_id' => $private->id,
                        'is_accepted' => false,
                    ]);
                }
            });
        });

        // ── 4. POSTS ──────────────────────────────────────────────

        $postTemplates = [
            'Just shipped a new feature! Feels great to see it live.',
            'Anyone else struggling with CSS grid today? Just me?',
            'Hot take: tabs are better than spaces. Fight me.',
            'Started learning Rust this weekend. The borrow checker is... something.',
            'The best code is the code you never have to write.',
            'Debugging is like being a detective in a crime movie where you are also the murderer.',
            'Just discovered a 3-year-old TODO comment in production code. Classic.',
            'Pair programming is just two people looking at Stack Overflow together.',
            'Coffee intake today: concerning. Code output: also concerning.',
            'Finally figured out that Docker networking issue. It was DNS. It is always DNS.',
            'Working on a side project. This time I will definitely finish it.',
            'The amount of YAML I write daily is truly disturbing.',
            'My git log is a work of art. Abstract art, but still art.',
            "Can we normalize not knowing everything? I've been coding for years and still Google basic stuff.",
            'New framework just dropped. Time to rewrite everything from scratch.',
            'Why do all my brilliant ideas come at 2 AM when I should be sleeping?',
            'Refactored a 500-line function into 10 small ones. Feels therapeutic.',
            "Reading through legacy code is like archeology but less fun.",
            'Deployed on a Friday. Living dangerously.',
            'The real programming language was the friends we made along the way.',
            'Just wrote a regex that actually works on the first try. Peak life achievement.',
            'My rubber duck debugger just quit. Said something about hostile work environment.',
            'TypeScript generics are either beautiful or terrifying depending on the hour.',
            "Remember: a PR with 1000 lines changed will get 'LGTM' in 5 minutes.",
            'The documentation says it should work. The documentation lies.',
            "Hot take: most microservices should just be functions.",
            'Spent 4 hours debugging. The issue was a missing semicolon.',
            'Writing tests after the fact is like putting on a seatbelt after the crash.',
            'Open source maintainers deserve more appreciation.',
            'The difference between a junior and senior dev is how many Stack Overflow tabs they have open.',
            'Just realized my localhost has more features than our production app.',
            'API rate limits are just the server saying it needs personal space.',
            "Build pipelines: because manually deploying wasn't stressful enough.",
            'Every time I write console.log I lose a year of my life.',
            'Who needs sleep when you have an interesting bug to chase?',
            'Code review feedback: "interesting approach" translation: "what were you thinking?"',
            'Machine learning is just statistics wearing a fancy hat.',
            'My terminal history is my autobiography.',
            'Sometimes the best optimization is deleting code.',
            'Version control saved my life today. Again.',
        ];

        // Regular posts (60 posts spread across users)
        $posts = collect();
        for ($i = 0; $i < 60; $i++) {
            $post = Post::create([
                'user_id' => $allUsers->random()->id,
                'content' => $postTemplates[array_rand($postTemplates)],
                'is_deleted' => false,
                'is_private' => false,
                'created_at' => now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
            ]);
            $posts->push($post);
        }

        // Some posts from private users (private posts)
        $privateUsers->each(function ($user) use ($posts, $postTemplates) {
            for ($i = 0; $i < 3; $i++) {
                $post = Post::create([
                    'user_id' => $user->id,
                    'content' => $postTemplates[array_rand($postTemplates)],
                    'is_deleted' => false,
                    'is_private' => true,
                    'created_at' => now()->subDays(rand(0, 20)),
                ]);
                $posts->push($post);
            }
        });

        // Superuser creates extra posts
        for ($i = 0; $i < 10; $i++) {
            $post = Post::create([
                'user_id' => $superUser->id,
                'content' => $postTemplates[array_rand($postTemplates)],
                'is_deleted' => false,
                'is_private' => false,
                'created_at' => now()->subDays(rand(0, 14))->subHours(rand(0, 23)),
            ]);
            $posts->push($post);
        }

        // Paragon creates extra posts
        for ($i = 0; $i < 8; $i++) {
            $post = Post::create([
                'user_id' => $paragon->id,
                'content' => $postTemplates[array_rand($postTemplates)],
                'is_deleted' => false,
                'is_private' => false,
                'created_at' => now()->subDays(rand(0, 14))->subHours(rand(0, 23)),
            ]);
            $posts->push($post);
        }

        $publicPosts = $posts->where('is_private', false)->values();

        // ── 5. HASHTAG ATTACHMENTS ────────────────────────────────

        $publicPosts->random(min(35, $publicPosts->count()))->each(function ($post) use ($hashtags) {
            $post->hashtags()->attach(
                $hashtags->random(rand(1, 3))->pluck('id')->toArray()
            );
        });

        // ── 6. REPLY THREADS (parent_post_id) ─────────────────────

        $replyTemplates = [
            'Totally agree with this!',
            'Not sure I follow, can you elaborate?',
            'This is the way.',
            'Underrated take.',
            'Been there, done that.',
            'Haha so relatable!',
            'Following for the replies.',
            'Thread incoming?',
            'This deserves more engagement.',
            'Hard disagree but respect the opinion.',
        ];

        $replies = collect();
        $publicPosts->random(min(20, $publicPosts->count()))->each(function ($post) use ($allUsers, $replyTemplates, $replies) {
            $replyCount = rand(1, 3);
            for ($i = 0; $i < $replyCount; $i++) {
                $reply = Post::create([
                    'user_id' => $allUsers->random()->id,
                    'content' => $replyTemplates[array_rand($replyTemplates)],
                    'parent_post_id' => $post->id,
                    'is_deleted' => false,
                    'is_private' => false,
                    'created_at' => $post->created_at->addMinutes(rand(5, 1440)),
                ]);
                $replies->push($reply);
            }
        });

        // Some nested replies (reply to a reply)
        $replies->random(min(8, $replies->count()))->each(function ($reply) use ($allUsers, $replyTemplates, $replies) {
            $nested = Post::create([
                'user_id' => $allUsers->random()->id,
                'content' => $replyTemplates[array_rand($replyTemplates)],
                'parent_post_id' => $reply->id,
                'is_deleted' => false,
                'is_private' => false,
                'created_at' => $reply->created_at->addMinutes(rand(5, 720)),
            ]);
            $replies->push($nested);
        });

        // ── 7. QUOTE POSTS ────────────────────────────────────────

        $quoteTemplates = [
            'This right here. Everyone needs to see this.',
            'Adding my two cents:',
            'Quoted for emphasis.',
            'I was just thinking about this!',
            'Cannot stress this enough.',
        ];

        $publicPosts->random(min(12, $publicPosts->count()))->each(function ($post) use ($allUsers, $quoteTemplates, $posts) {
            $quote = Post::create([
                'user_id' => $allUsers->random()->id,
                'content' => $quoteTemplates[array_rand($quoteTemplates)],
                'quote_post_id' => $post->id,
                'is_deleted' => false,
                'is_private' => false,
                'created_at' => $post->created_at->addHours(rand(1, 48)),
            ]);
            $posts->push($quote);
        });

        // Refresh public posts collection
        $allPosts = Post::where('is_deleted', false)->get();
        $allPublicPosts = $allPosts->where('is_private', false)->values();

        // ── 8. COMMENTS ───────────────────────────────────────────

        $commentTemplates = [
            'Great post!',
            'I completely agree.',
            'Interesting perspective.',
            'Could you share more details?',
            'This made my day.',
            'Saving this for later.',
            'So true!',
            'I needed to hear this today.',
            'Well said.',
            'Love this take.',
            'Wait, really? That is surprising.',
            'Bookmarked!',
            'The accuracy of this post is off the charts.',
            'Wish I could upvote this twice.',
            'This deserves its own blog post.',
        ];

        $comments = collect();

        // Top-level comments on public posts
        $allPublicPosts->random(min(40, $allPublicPosts->count()))->each(function ($post) use ($allUsers, $commentTemplates, $comments) {
            $numComments = rand(1, 4);
            for ($i = 0; $i < $numComments; $i++) {
                $comment = Comment::create([
                    'user_id' => $allUsers->random()->id,
                    'post_id' => $post->id,
                    'content' => $commentTemplates[array_rand($commentTemplates)],
                    'created_at' => $post->created_at->addMinutes(rand(10, 2880)),
                ]);
                $comments->push($comment);
            }
        });

        // Nested replies on some comments
        $comments->random(min(25, $comments->count()))->each(function ($comment) use ($allUsers, $commentTemplates, $comments) {
            $reply = Comment::create([
                'user_id' => $allUsers->random()->id,
                'post_id' => $comment->post_id,
                'parent_comment_id' => $comment->id,
                'content' => $commentTemplates[array_rand($commentTemplates)],
                'created_at' => $comment->created_at->addMinutes(rand(5, 1440)),
            ]);
            $comments->push($reply);
        });

        // ── 9. LIKES (polymorphic: posts & comments) ──────────────

        // Likes on posts
        $allPublicPosts->each(function ($post) use ($allUsers) {
            $likers = $allUsers->random(rand(0, min(15, $allUsers->count())));
            $likers->each(function ($user) use ($post) {
                Like::create([
                    'user_id' => $user->id,
                    'likeable_id' => $post->id,
                    'likeable_type' => Post::class,
                    'is_deleted' => false,
                ]);
            });
        });

        // Likes on comments
        $comments->random(min(40, $comments->count()))->each(function ($comment) use ($allUsers) {
            $likers = $allUsers->random(rand(1, min(8, $allUsers->count())));
            $likers->each(function ($user) use ($comment) {
                $exists = Like::where('user_id', $user->id)
                    ->where('likeable_id', $comment->id)
                    ->where('likeable_type', Comment::class)
                    ->exists();

                if (! $exists) {
                    Like::create([
                        'user_id' => $user->id,
                        'likeable_id' => $comment->id,
                        'likeable_type' => Comment::class,
                        'is_deleted' => false,
                    ]);
                }
            });
        });

        // ── 10. FAVORITES ─────────────────────────────────────────

        $allUsers->each(function ($user) use ($allPublicPosts) {
            $favCount = rand(0, min(8, $allPublicPosts->count()));
            if ($favCount === 0) return;

            $allPublicPosts->random($favCount)->each(function ($post) use ($user) {
                Favorite::create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                    'is_deleted' => false,
                ]);
            });
        });

        // ── 11. REPOSTS ───────────────────────────────────────────

        $allUsers->each(function ($user) use ($allPublicPosts) {
            // Don't repost your own posts
            $eligible = $allPublicPosts->where('user_id', '!=', $user->id)->values();
            if ($eligible->isEmpty()) return;

            $repostCount = rand(0, min(5, $eligible->count()));
            if ($repostCount === 0) return;

            $eligible->random($repostCount)->each(function ($post) use ($user) {
                Repost::create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                ]);
            });
        });

        // ── 12. POLLS ─────────────────────────────────────────────

        $pollQuestions = [
            [
                'content' => 'What is the best frontend framework in 2025?',
                'options' => ['React', 'Vue', 'Svelte', 'Angular'],
                'expires' => now()->addDays(7),
            ],
            [
                'content' => 'Tabs or spaces?',
                'options' => ['Tabs', 'Spaces', '2 spaces', '4 spaces'],
                'expires' => now()->addDays(3),
            ],
            [
                'content' => 'Favorite database?',
                'options' => ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'],
                'expires' => now()->addDays(5),
            ],
            [
                'content' => 'Dark mode or light mode?',
                'options' => ['Dark mode', 'Light mode', 'System preference'],
                'expires' => now()->subDays(2), // already expired
            ],
            [
                'content' => 'What is your preferred deployment strategy?',
                'options' => ['Docker/K8s', 'Serverless', 'VPS', 'PaaS (Heroku/Railway)'],
                'expires' => now()->addDays(14),
            ],
            [
                'content' => 'How many monitors do you use?',
                'options' => ['1', '2', '3+', 'Laptop only'],
                'expires' => null, // no expiry
            ],
        ];

        foreach ($pollQuestions as $pq) {
            $pollPost = Post::create([
                'user_id' => $allUsers->random()->id,
                'content' => $pq['content'],
                'is_deleted' => false,
                'is_private' => false,
                'created_at' => now()->subDays(rand(1, 14)),
            ]);

            $poll = Poll::create([
                'post_id' => $pollPost->id,
                'expires_at' => $pq['expires'],
            ]);

            $options = collect();
            foreach ($pq['options'] as $optText) {
                $options->push(PollOption::create([
                    'poll_id' => $poll->id,
                    'text' => $optText,
                ]));
            }

            // Random votes from users (each user votes once)
            $voters = $allUsers->random(rand(8, min(25, $allUsers->count())));
            $voters->each(function ($voter) use ($poll, $options) {
                PollVote::create([
                    'poll_id' => $poll->id,
                    'poll_option_id' => $options->random()->id,
                    'user_id' => $voter->id,
                ]);
            });
        }

        // ── 13. DIRECT CHATS & MESSAGES ───────────────────────────

        $chatPairs = [];
        for ($i = 0; $i < 10; $i++) {
            $u1 = $allUsers->random();
            $u2 = $allUsers->where('id', '!=', $u1->id)->random();

            // Normalize pair to avoid duplicates
            $key = min($u1->id, $u2->id) . '-' . max($u1->id, $u2->id);
            if (isset($chatPairs[$key])) continue;
            $chatPairs[$key] = true;

            $chat = Chat::create([
                'user1_id' => min($u1->id, $u2->id),
                'user2_id' => max($u1->id, $u2->id),
            ]);

            $messageTexts = [
                'Hey, how are you?',
                'Did you see that post about Docker?',
                'Working on anything interesting?',
                'lol yeah that was hilarious',
                'Let me send you the link',
                'Thanks for the help earlier!',
                'Sure, sounds good',
                'Can you review my PR when you get a chance?',
                'Just pushed the fix',
                'Nice, looks great!',
            ];

            $msgCount = rand(3, 8);
            $lastMessage = null;
            for ($j = 0; $j < $msgCount; $j++) {
                $sender = fake()->boolean() ? $u1 : $u2;
                $msg = Message::create([
                    'user_id' => $sender->id,
                    'chat_id' => $chat->id,
                    'text' => $messageTexts[array_rand($messageTexts)],
                    'read_at' => $j < $msgCount - 1 ? now()->subMinutes(rand(1, 60)) : null,
                    'created_at' => now()->subDays(rand(0, 7))->subMinutes($msgCount - $j),
                ]);
                $lastMessage = $msg;
            }

            if ($lastMessage) {
                $chat->update(['last_message_id' => $lastMessage->id]);
            }
        }

        // Superuser has a chat with paragon + a few others
        $superChatPartners = $users->random(3)->push($paragon);
        $superChatPartners->each(function ($otherUser) use ($superUser) {
            $key1 = min($superUser->id, $otherUser->id);
            $key2 = max($superUser->id, $otherUser->id);

            $exists = Chat::where('user1_id', $key1)->where('user2_id', $key2)->exists();
            if ($exists) return;

            $chat = Chat::create([
                'user1_id' => $key1,
                'user2_id' => $key2,
            ]);

            $texts = [
                'Hey! Welcome to Spark.',
                'Thanks! Really liking the platform.',
                'Any features you want to see?',
                'Dark mode is amazing btw.',
                'Glad you like it!',
            ];

            $lastMsg = null;
            foreach ($texts as $i => $text) {
                $sender = $i % 2 === 0 ? $superUser : $otherUser;
                $msg = Message::create([
                    'user_id' => $sender->id,
                    'chat_id' => $chat->id,
                    'text' => $text,
                    'read_at' => $i < count($texts) - 1 ? now() : null,
                    'created_at' => now()->subDays(3)->addMinutes($i * 15),
                ]);
                $lastMsg = $msg;
            }

            if ($lastMsg) {
                $chat->update(['last_message_id' => $lastMsg->id]);
            }
        });

        // Paragon has a couple of dedicated chats
        $paragonChatUsers = $users->random(3);
        $paragonChatUsers->each(function ($otherUser) use ($paragon) {
            $key1 = min($paragon->id, $otherUser->id);
            $key2 = max($paragon->id, $otherUser->id);

            $exists = Chat::where('user1_id', $key1)->where('user2_id', $key2)->exists();
            if ($exists) return;

            $chat = Chat::create([
                'user1_id' => $key1,
                'user2_id' => $key2,
            ]);

            $texts = [
                'Hey! Welcome to Spark.',
                'Thanks! Really liking the platform.',
                'Any features you want to see?',
                'Dark mode is amazing btw.',
                'Glad you like it!',
            ];

            $lastMsg = null;
            foreach ($texts as $i => $text) {
                $sender = $i % 2 === 0 ? $paragon : $otherUser;
                $msg = Message::create([
                    'user_id' => $sender->id,
                    'chat_id' => $chat->id,
                    'text' => $text,
                    'read_at' => $i < count($texts) - 1 ? now() : null,
                    'created_at' => now()->subDays(3)->addMinutes($i * 15),
                ]);
                $lastMsg = $msg;
            }

            if ($lastMsg) {
                $chat->update(['last_message_id' => $lastMsg->id]);
            }
        });

        // ── 14. GROUP CHATS ───────────────────────────────────────

        $groupChatData = [
            ['name' => 'Laravel Enthusiasts', 'memberCount' => 8],
            ['name' => 'Frontend Gang', 'memberCount' => 6],
            ['name' => 'DevOps Corner', 'memberCount' => 5],
        ];

        foreach ($groupChatData as $gcData) {
            $creator = $allUsers->random();
            $gc = GroupChat::create([
                'name' => $gcData['name'],
                'creator_id' => $creator->id,
            ]);

            // Add creator + random members
            $members = $allUsers->where('id', '!=', $creator->id)
                ->random(min($gcData['memberCount'] - 1, $allUsers->count() - 1));
            $memberIds = $members->pluck('id')->push($creator->id)->unique();

            $gc->members()->attach($memberIds->toArray());

            $groupMessages = [
                'Hey everyone!',
                'Who is up for a code review session?',
                'Just found a great article, sharing soon.',
                'Anyone tried the new update?',
                'This channel is awesome.',
                'Quick question about deployment...',
                'Thanks for the help!',
                'See you all tomorrow.',
            ];

            $allMembers = $members->push($creator);
            for ($m = 0; $m < rand(5, 10); $m++) {
                Message::create([
                    'user_id' => $allMembers->random()->id,
                    'group_chat_id' => $gc->id,
                    'text' => $groupMessages[array_rand($groupMessages)],
                    'read_at' => fake()->boolean(60) ? now()->subMinutes(rand(1, 120)) : null,
                    'created_at' => now()->subDays(rand(0, 5))->subMinutes(rand(0, 1440)),
                ]);
            }
        }

        // ── 15. NOTIFICATIONS ─────────────────────────────────────

        // Like notifications
        $allPublicPosts->random(min(20, $allPublicPosts->count()))->each(function ($post) use ($allUsers) {
            $liker = $allUsers->where('id', '!=', $post->user_id)->random();
            Notification::create([
                'user_id' => $post->user_id,
                'source_user_id' => $liker->id,
                'post_id' => $post->id,
                'type' => 'like',
                'is_read' => fake()->boolean(60),
                'created_at' => $post->created_at->addMinutes(rand(5, 1440)),
            ]);
        });

        // Comment notifications
        $comments->random(min(15, $comments->count()))->each(function ($comment) {
            $post = Post::find($comment->post_id);
            if (! $post || $comment->user_id === $post->user_id) return;

            Notification::create([
                'user_id' => $post->user_id,
                'source_user_id' => $comment->user_id,
                'post_id' => $post->id,
                'comment_id' => $comment->id,
                'type' => 'comment',
                'is_read' => fake()->boolean(50),
                'created_at' => $comment->created_at,
            ]);
        });

        // Follow notifications
        Follow::where('is_accepted', true)->inRandomOrder()->limit(20)->get()->each(function ($follow) {
            Notification::create([
                'user_id' => $follow->followee_id,
                'source_user_id' => $follow->follower_id,
                'type' => 'follow',
                'is_read' => fake()->boolean(70),
            ]);
        });

        // Follow request notifications (for private accounts)
        Follow::where('is_accepted', false)->get()->each(function ($follow) {
            Notification::create([
                'user_id' => $follow->followee_id,
                'source_user_id' => $follow->follower_id,
                'type' => 'follow_request',
                'is_read' => fake()->boolean(30),
            ]);
        });

        // Repost notifications
        Repost::inRandomOrder()->limit(15)->get()->each(function ($repost) {
            $post = Post::find($repost->post_id);
            if (! $post || $repost->user_id === $post->user_id) return;

            Notification::create([
                'user_id' => $post->user_id,
                'source_user_id' => $repost->user_id,
                'post_id' => $post->id,
                'type' => 'repost',
                'is_read' => fake()->boolean(50),
            ]);
        });

        // Favorite notifications
        Favorite::inRandomOrder()->limit(15)->get()->each(function ($fav) {
            $post = Post::find($fav->post_id);
            if (! $post || $fav->user_id === $post->user_id) return;

            Notification::create([
                'user_id' => $post->user_id,
                'source_user_id' => $fav->user_id,
                'post_id' => $post->id,
                'type' => 'favorite',
                'is_read' => fake()->boolean(40),
            ]);
        });

        // Mention notifications (a few manual ones)
        $allPublicPosts->random(min(5, $allPublicPosts->count()))->each(function ($post) use ($allUsers) {
            $mentioned = $allUsers->where('id', '!=', $post->user_id)->random();
            Notification::create([
                'user_id' => $mentioned->id,
                'source_user_id' => $post->user_id,
                'post_id' => $post->id,
                'type' => 'mention',
                'is_read' => fake()->boolean(50),
                'created_at' => $post->created_at,
            ]);
        });

        // ── 16. PINNED POSTS ──────────────────────────────────────

        // Superuser pins a post
        $superPost = Post::where('user_id', $superUser->id)
            ->whereNull('parent_post_id')
            ->first();
        if ($superPost) {
            $superUser->update(['pinned_post_id' => $superPost->id]);
        }

        // Paragon pins a post
        $paragonPost = Post::where('user_id', $paragon->id)
            ->whereNull('parent_post_id')
            ->first();
        if ($paragonPost) {
            $paragon->update(['pinned_post_id' => $paragonPost->id]);
        }

        // A few other users pin posts
        $users->random(min(5, $users->count()))->each(function ($user) {
            $post = Post::where('user_id', $user->id)
                ->whereNull('parent_post_id')
                ->first();
            if ($post) {
                $user->update(['pinned_post_id' => $post->id]);
            }
        });
    }
}
