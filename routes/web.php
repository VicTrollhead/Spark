<?php

//use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::post('/api/auth/google/callback', [GoogleAuthController::class, 'callback']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [UserController::class, 'index'])->name('dashboard');
    Route::get('dashboard/users', [UserController::class, 'users'])->name('dashboard.users');

    Route::get('/user', [UserController::class, 'show'])->name('user.show');
    Route::get('/user/{user}/edit', [UserController::class, 'edit'])->name('user.edit');
    Route::patch('/user/{user}/update', [UserController::class, 'update'])->name('user.update');
    Route::get('/user/{user}', [UserController::class, 'show'])->name('user.show');

    Route::post('/user/{user}/follow', [FollowController::class, 'follow'])->name('user.follow');
    Route::post('/user/{user}/unfollow', [FollowController::class, 'unfollow'])->name('user.unfollow');
    Route::get('/is-following/{user}', [FollowController::class, 'isFollowing'])->name('isFollowing');
    Route::get('/user/{user}/followers', [FollowController::class, 'followers'])->name('user.followers');
    Route::get('/user/{user}/following', [FollowController::class, 'following'])->name('user.following');

    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/dashboard', [PostController::class, 'store'])->name('posts.store');
    Route::get('/post/{post}', [PostController::class, 'show'])->name('post.show');
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    Route::post('/post/{post}/like', [LikeController::class, 'like'])->name('post.like');
    Route::post('/post/{post}/unlike', [LikeController::class, 'unlike'])->name('post.unlike');
    Route::get('/post/{post}/is-liked', [LikeController::class, 'isLiked'])->name('post.isLiked');






});




















//// 🏠 Public Routes
//Route::get('/', function () {
//    return Inertia::render('Welcome', [
//        'canLogin' => Route::has('login'),
//        'canRegister' => Route::has('register'),
//        'laravelVersion' => Application::VERSION,
//        'phpVersion' => PHP_VERSION,
//    ]);
//});
//
//// 🔒 Dashboard - Requires Authentication & Email Verification
//Route::middleware(['auth', 'verified'])->group(function () {
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
//});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
