<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;


class GoogleAuthController extends Controller
{

    public function googleLogin(): SymfonyRedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function googleAuth(): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $user = User::where('email', $googleUser->getEmail())->first();

        if ($user) {
            Auth::login($user);
            return redirect()->route('dashboard');
        }

        $baseUsername = strstr($googleUser->getEmail(), '@', true);
        $username = $baseUsername;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        $user = User::create([
            'name' => $googleUser->getName(),
            'username' => $username,
            'email' => $googleUser->getEmail(),
            'password' => bcrypt(Str::random()),
            'email_verified_at' => now(),
            'profile_image_url' => $googleUser->getAvatar(),
        ]);

        Auth::login($user);
        return redirect()->route('dashboard');
    }

}
