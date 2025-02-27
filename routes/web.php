<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
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
