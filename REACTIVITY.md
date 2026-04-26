# Spark — Reactivity Plan

Audit and implementation plan for making Spark update in real-time without manual refreshes.

---

## Current State

### Already Real-Time (Working)
- **Notification badge** (header/sidebar) — `NotificationCreated`, `NotificationIsReadChange` events
- **Unread messages badge** (header/sidebar) — `UserMessageCreated`, `UserMessageIsReadChange` events
- **Typing indicators** in DMs — `UserTyping` event
- **Read receipts** on messages — `MessagesRead` event

### Partially Real-Time (Uses `router.reload()` Instead of Delta Updates)
- **DM messages** (`user-chat.jsx`) — `GotPersonalMessage` triggers full reload
- **Public chat** (`everyone-chat.jsx`) — `GotMessage` triggers full reload
- **Comments on post** (`show-post.jsx`) — `CommentCreated` triggers full reload
- **Chat list** (`user-chats.jsx`) — `UserMessageCreated` triggers full reload
- **Notifications page** (`notifications.jsx`) — events trigger full reload

### Not Real-Time at All
- **New posts in dashboard feed** — no broadcast, manual refresh only
- **New posts in following feed** — no broadcast, manual refresh only
- **Like/favorite/repost counts** — optimistic for current user only, other viewers see nothing
- **Comment counts on feed posts** — only the commenter sees the update
- **Follower/following counts** on profiles — static until page reload
- **Follow button state** — optimistic local only, not synced to other viewers
- **Follower/following/friends lists** — manual refresh button
- **Favorites/liked/reposts lists** — manual refresh button
- **Search results** — static per search query

---

## Implementation Plan

### Tier 1: Feed & Engagement (High Impact)

#### 1.1 New Posts in Feed
- **New event:** `PostCreated` — broadcast on user's private channel to all followers
- **Backend:** Fire `PostCreated` in `PostController@store` after creating the post
- **Channel:** `feed.{follower_id}` for each follower (or use a public channel with server filtering)
- **Frontend (`dashboard.jsx`):** Listen for `PostCreated`, prepend new post to feed state with a "New posts available" banner (Twitter-style — don't auto-insert to avoid scroll jump)
- **Frontend (`following-posts.jsx`):** Same listener pattern
- **Files:** `app/Events/PostCreated.php` (new), `PostController.php`, `dashboard.jsx`, `following-posts.jsx`

#### 1.2 Like/Favorite/Repost Count Updates
- **New event:** `PostEngagementChanged` — broadcast on post's channel
- **Backend:** Fire after like/unlike, favorite/unfavorite, repost/undo-repost
- **Channel:** `post.{post_id}` (already exists for comments)
- **Payload:** `{ post_id, likes_count, favorites_count, reposts_count }`
- **Frontend (`post-component.jsx`):** Each rendered post subscribes to `post.{id}` channel on mount, updates counts on `PostEngagementChanged` event. Unsubscribe on unmount.
- **Concern:** Subscribing to a channel per post on the feed could be expensive with many posts. Alternative: batch updates via a single `feed.{user_id}` channel that sends periodic engagement snapshots, or only subscribe for posts currently in viewport.
- **Files:** `app/Events/PostEngagementChanged.php` (new), `LikeController.php`, `FavoriteController.php`, `RepostController.php`, `post-component.jsx`

#### 1.3 Comment Count on Feed Posts
- **Reuse:** `CommentCreated` event already exists on `post.{post_id}` channel
- **Frontend (`post-component.jsx`):** Listen for `CommentCreated` on the post's channel and increment `comments_count` in state (currently only `show-post.jsx` listens)
- **Files:** `post-component.jsx`

---

### Tier 2: Chat & Social Updates (Medium Impact)

#### 2.1 Delta Message Updates (Replace `router.reload()`)
- **Problem:** All chat pages use `router.reload()` when a new message arrives, causing a full Inertia reload
- **Fix (`user-chat.jsx`):** On `GotPersonalMessage`, append the new message to local state instead of reloading. The event payload already contains the message data — use it directly.
- **Fix (`everyone-chat.jsx`):** Same approach — append message to state from event payload
- **Fix (`user-chats.jsx`):** On `UserMessageCreated`, update the specific chat's last message and unread count in local state instead of reloading the entire list
- **Files:** `user-chat.jsx`, `everyone-chat.jsx`, `user-chats.jsx`

#### 2.2 Follow/Unfollow Broadcast
- **New event:** `FollowChanged` — broadcast to the target user
- **Backend:** Fire in `FollowController` after follow/unfollow/accept/reject
- **Channel:** `user.{user_id}` (new private channel per user)
- **Payload:** `{ follower_id, action: 'followed'|'unfollowed'|'accepted'|'rejected', follower_count, following_count }`
- **Frontend (`show.jsx`):** If viewing the affected user's profile, update follower count and follow button state
- **Frontend (`followers.jsx`, `following.jsx`):** Append/remove user from list
- **Files:** `app/Events/FollowChanged.php` (new), `FollowController.php`, `show.jsx`, `followers.jsx`, `following.jsx`

#### 2.3 Notifications Page Delta Updates
- **Problem:** `notifications.jsx` listens to Echo but triggers `router.reload()`
- **Fix:** On `NotificationCreated`, prepend the new notification to local state. On `NotificationIsReadChange`, toggle the `read_at` field in local state.
- **Files:** `notifications.jsx`

---

### Tier 3: Nice-to-Have

#### 3.1 Group Chat Delta Updates
- **Same pattern as 2.1:** Replace `router.reload()` with local state append in `group-chat.jsx`
- **Files:** `group-chat.jsx`

#### 3.2 Online/Offline Status
- **Use Laravel Echo presence channels:** `presence-online` channel
- **Backend:** Users join on page load, leave on disconnect
- **Frontend:** Track online user IDs, show green dot on avatars in chat list and DMs
- **Files:** New `useOnlineUsers` hook, `user-chat.jsx`, `user-chats.jsx`

#### 3.3 Profile Stats Real-Time
- **Reuse `user.{id}` channel** from 2.2 to also broadcast post count changes
- **Frontend (`show.jsx`):** Update stats bar (posts count, follower count) in real-time
- **Files:** `show.jsx`

---

## Architecture Notes

### Channel Strategy
| Channel | Events | Subscribers |
|---------|--------|-------------|
| `notifications.{user_id}` | `NotificationCreated`, `NotificationIsReadChange` | Already exists |
| `user-chats.{user_id}` | `UserMessageCreated`, `UserMessageIsReadChange` | Already exists |
| `chat.{chat_id}` | `GotPersonalMessage`, `UserTyping`, `MessagesRead` | Already exists |
| `post.{post_id}` | `CommentCreated`, `PostEngagementChanged` (new) | Exists for comments, extend for engagement |
| `feed.{user_id}` | `PostCreated` (new) | New — each user subscribes to their own feed channel |
| `user.{user_id}` | `FollowChanged` (new) | New — for social updates |
| `channel_for_everyone` | `GotMessage` | Already exists |
| `presence-online` | join/leave | New — Tier 3 only |

### Performance Considerations
- **Per-post channels:** Subscribing to `post.{id}` for every visible post on the feed (15+ posts) creates many WebSocket subscriptions. Mitigation options:
  1. Only subscribe to posts in viewport (IntersectionObserver)
  2. Use a single `feed.{user_id}` channel that batches engagement updates periodically
  3. Accept the overhead — Reverb/Pusher can handle it for moderate user counts
- **Fan-out for PostCreated:** When a user with 10k followers creates a post, broadcasting to 10k `feed.{follower_id}` channels is expensive. Better approach: broadcast on a `user-posts.{author_id}` channel, and have followers subscribe to channels of users they follow. This limits channels per user to their following count.
- **Cleanup:** Always `window.Echo.leave()` channels on component unmount to prevent memory leaks.

### New Events to Create
1. `app/Events/PostCreated.php` — `ShouldBroadcast`, channel: `feed.{user_id}` for each follower
2. `app/Events/PostEngagementChanged.php` — `ShouldBroadcast`, channel: `post.{post_id}`
3. `app/Events/FollowChanged.php` — `ShouldBroadcast`, channel: `user.{user_id}`

### Pattern for Replacing `router.reload()`
Current (bad):
```js
Echo.private(`post.${post.id}`).listen('CommentCreated', () => {
    router.reload();
});
```

Target (good):
```js
Echo.private(`post.${post.id}`).listen('CommentCreated', (e) => {
    setComments(prev => [...prev, e.comment]);
    setCommentsCount(prev => prev + 1);
});
```

---

## Implementation Order
1. ~~**1.1** New posts in feed~~ ✅ Done
2. ~~**1.3** Comment count on feed posts~~ ✅ Done
3. ~~**2.1** Delta message updates~~ ✅ Done (user-chat, everyone-chat; user-chats kept partial reload)
4. ~~**2.3** Notifications page delta updates~~ ✅ Done
5. ~~**1.2** Engagement count updates~~ ✅ Done
6. ~~**2.2** Follow/unfollow broadcast~~ ✅ Done
7. ~~**3.1** Group chat delta updates~~ ✅ Done
8. ~~**3.2** Online/offline status~~ ✅ Done (presence channel + green dot on chat pages)
9. ~~**3.3** Profile stats real-time~~ ✅ Done (follower/following counts already reactive via FollowChanged)
