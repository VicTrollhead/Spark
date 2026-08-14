<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cookie;
use Inertia\Inertia;
use Inertia\Response;

class LanguageController extends Controller
{
    /**
     * Show page settings with language
     */
    public function show(Request $request): Response
    {
        $locale = App::currentLocale();

        return Inertia::render('settings/language', [
            'locale' => $locale,
        ]);
    }

    /**
     * Change language
     */
    public function change(string $newLang, Request $request): RedirectResponse
    {
        App::setLocale($newLang);
        Cookie::queue('locale', $newLang, 60 * 24 * 365);

        return redirect()->back();
    }
}
