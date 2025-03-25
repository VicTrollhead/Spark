<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function callback(Request $request): JsonResponse
    {
        $token = $request->input('token');

        $googleResponse = Http::get("https://oauth2.googleapis.com/tokeninfo?id_token={$token}");

        if (!$googleResponse->successful()) {
            return response()->json(['success' => false, 'message' => "Error auth with token: {$token}"], 401);
        }

        $googleUser = $googleResponse->json();

        $user = User::where('email', $googleUser['email'])->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser['name'],
                'email' => $googleUser['email'],
                'password' => bcrypt(Str::random()),
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user);

        return response()->json(['success' => true]);
    }
}
