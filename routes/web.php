<?php

// use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\GroupChatController;
use App\Http\Controllers\HashtagController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PollController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\RepostController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\UserContentController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\UserSocialController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('welcome');
})->name('home');

Route::get('/api/auth/google/callback', [GoogleAuthController::class, 'googleAuth'])->name('api.auth.google.callback');
Route::get('/api/auth/google', [GoogleAuthController::class, 'googleLogin'])->name('api.auth.google');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [PostController::class, 'index'])->name('dashboard');
    Route::get('dashboard/users', [UserSocialController::class, 'users'])->name('dashboard.users');
    Route::get('/users-list', [UserSocialController::class, 'usersList'])->name('users.list');

    Route::get('/user/favorites', [UserContentController::class, 'favorites'])->name('user.favorites');
    Route::get('/user/liked', [UserContentController::class, 'liked'])->name('user.liked');
    Route::get('/user/reposts', [UserContentController::class, 'reposts'])->name('user.reposts');
    Route::get('/user/following-posts', [UserContentController::class, 'followingPosts'])->name('user.followingPosts');
    Route::get('/user/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/user', [UserProfileController::class, 'show'])->name('user.show');
    Route::get('/user/friends', [UserSocialController::class, 'friends'])->name('user.friends');
    Route::get('/user/{user}/edit', [UserProfileController::class, 'edit'])->name('user.edit');
    Route::patch('/user/{user}/update', [UserProfileController::class, 'update'])->name('user.update');

    Route::get('/user/{user}', [UserProfileController::class, 'show'])->name('user.show');
    Route::get('/search', [SearchController::class, 'index'])->name('search');
    Route::get('/user/search/{searchText}', [UserSocialController::class, 'search'])->name('user.search');
    Route::get('/search-empty', [UserSocialController::class, 'searchEmpty'])->name('user.searchEmpty');

    Route::post('/user/{user}/follow', [FollowController::class, 'follow'])->name('user.follow')->middleware('throttle:60,1');
    Route::post('/user/{user}/unfollow', [FollowController::class, 'unfollow'])->name('user.unfollow')->middleware('throttle:60,1');
    Route::post('/user/{user}/follow-request', [FollowController::class, 'sendFollowRequest'])->name('follow.request')->middleware('throttle:60,1');
    Route::post('/user/{user}/{notification}/accept-request', [FollowController::class, 'acceptRequest'])->name('follow.acceptRequest')->middleware('throttle:60,1');
    Route::post('/user/{user}/{notification}/reject-request', [FollowController::class, 'rejectRequest'])->name('follow.rejectRequest')->middleware('throttle:60,1');
    Route::get('/is-following/{user}', [FollowController::class, 'isFollowing'])->name('isFollowing');
    Route::get('/user/{user}/followers', [FollowController::class, 'followers'])->name('user.followers');
    Route::get('/user/{user}/following', [FollowController::class, 'following'])->name('user.following');

    Route::get('/post/{post}', [PostController::class, 'show'])->name('post.show');
    Route::get('/show-popular-hashtags', [HashtagController::class, 'showPopular'])->name('showPopularHashtags');
    Route::get('/popular-hashtags', [HashtagController::class, 'popular'])->name('popularHashtags');
    Route::get('/trending-hashtags', [HashtagController::class, 'trending'])->name('trendingHashtags');
    Route::get('/posts-by-hashtag/{hashtag}', [HashtagController::class, 'postsByHashtag'])->name('postsByHashtag');
    Route::get('/{type}/{id}/is-liked', [LikeController::class, 'isLiked'])->name('like.isLiked');
    Route::get('/post/{post}/is-favorited', [FavoriteController::class, 'isFavorited'])->name('post.isFavorited');
    Route::get('/post/{post}/edit', [PostController::class, 'edit'])->name('post.edit');

    // Write routes — throttled to 60 requests per minute
    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/dashboard', [PostController::class, 'store'])->name('posts.store');
        Route::delete('/post/{post}', [PostController::class, 'destroy'])->name('post.destroy');
        Route::post('/like', [LikeController::class, 'like'])->name('like');
        Route::post('/unlike', [LikeController::class, 'unlike'])->name('unlike');
        Route::post('/post/{post}/add-favorite', [FavoriteController::class, 'addFavorite'])->name('post.addFavorite');
        Route::post('/post/{post}/remove-favorite', [FavoriteController::class, 'removeFavorite'])->name('post.removeFavorite');
        Route::post('/post/{post}/comment', [CommentController::class, 'store'])->name('post.comment');
        Route::post('/comment/{comment}/delete', [CommentController::class, 'destroy'])->name('comment.delete');
        Route::post('/post/{post}/repost', [RepostController::class, 'repost'])->name('post.repost');
        Route::post('/post/{post}/undo', [RepostController::class, 'undo'])->name('post.undoRepost');
        Route::patch('/post/{post}/update', [PostController::class, 'update'])->name('post.update');
        Route::post('/post/{post}/toggle-pin', [PostController::class, 'togglePin'])->name('post.togglePin');
        Route::post('/poll/{poll}/vote', [PollController::class, 'vote'])->name('poll.vote');
    });

    Route::get('/chat/everyone', [ChatController::class, 'getEveryoneChat'])->name('chat.getEveryoneChat');
    Route::post('/chat/message', [ChatController::class, 'message'])->name('chat.message')->middleware('throttle:60,1');
    Route::get('/chat/user-chats', [ChatController::class, 'getUserChats'])->name('chat.getUserChats');
    Route::get('/chat/user-chat/{user}', [ChatController::class, 'getUserChat'])->name('chat.getUserChat');
    Route::post('/chat/user-chat/new/{user}', [ChatController::class, 'searchOrCreateUserChat'])->name('chat.createUserChat')->middleware('throttle:60,1');
    Route::post('/chat/user-chat/post-message', [ChatController::class, 'postMessageToUserChat'])->name('chat.postMessageToUserChat')->middleware('throttle:60,1');
    Route::delete('/chat/message/{message}', [ChatController::class, 'deleteMessage'])->name('chat.deleteMessage')->middleware('throttle:60,1');
    Route::delete('/chat/user-chat/{chat}', [ChatController::class, 'deleteChat'])->name('chat.deleteChat')->middleware('throttle:60,1');
    Route::post('/chat/user-chat/{chat}/mark-messages-as-read', [ChatController::class, 'markAsRead'])->name('chat.markAsRead');
    Route::post('/chat/user-chat/{chat}/typing', [ChatController::class, 'typing'])->name('chat.typing');

    Route::post('/chat/group/create', [GroupChatController::class, 'store'])->name('groupChat.store')->middleware('throttle:60,1');
    Route::get('/chat/group/{groupChat}', [GroupChatController::class, 'show'])->name('groupChat.show');
    Route::post('/chat/group/post-message', [GroupChatController::class, 'postMessage'])->name('groupChat.postMessage')->middleware('throttle:60,1');
    Route::post('/chat/group/{groupChat}/add-members', [GroupChatController::class, 'addMembers'])->name('groupChat.addMembers')->middleware('throttle:60,1');
    Route::put('/chat/group/{groupChat}', [GroupChatController::class, 'update'])->name('groupChat.update')->middleware('throttle:60,1');
    Route::post('/chat/group/{groupChat}/remove-member', [GroupChatController::class, 'removeMember'])->name('groupChat.removeMember')->middleware('throttle:60,1');
    Route::delete('/chat/group/{groupChat}', [GroupChatController::class, 'destroy'])->name('groupChat.destroy')->middleware('throttle:60,1');
    Route::post('/chat/group/{groupChat}/leave', [GroupChatController::class, 'leave'])->name('groupChat.leave')->middleware('throttle:60,1');

    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('/notifications/{notification}/unread', [NotificationController::class, 'markAsUnread'])->name('notifications.unread');
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
    Route::patch('/notifications/mark-all-unread', [NotificationController::class, 'markAllAsUnread'])->name('notifications.markAllAsUnread');

    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadNotificationsCount'])->name('notifications.unreadCount');
    Route::get('/chat/user-chat/messages/unread-count', [ChatController::class, 'getUnreadMessagesCount'])->name('chat.getUnreadMessagesCount');

});

// // 🏠 Public Routes
// Route::get('/', function () {
//    return Inertia::render('Welcome', [
//        'canLogin' => Route::has('login'),
//        'canRegister' => Route::has('register'),
//        'laravelVersion' => Application::VERSION,
//        'phpVersion' => PHP_VERSION,
//    ]);
// });
//
// // 🔒 Dashboard - Requires Authentication & Email Verification
// Route::middleware(['auth', 'verified'])->group(function () {
//    Route::get('/dashboard', function () {
//        return Inertia::render('Dashboard');
//    })->name('dashboard');
//
//    // 👤 Profile Routes
//    Route::prefix('profile')->group(function () {
//        Route::get('/', [ProfileController::class, 'edit'])->name('profile.edit');
//        Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
//        Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
//    });
// });

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
