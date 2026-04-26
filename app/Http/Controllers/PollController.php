<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Poll;
use App\Models\PollVote;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PollController extends Controller
{
    public function vote(Request $request, Poll $poll): RedirectResponse
    {
        $request->validate([
            'option_id' => 'required|exists:poll_options,id',
        ]);

        $user = Auth::user();

        if ($poll->isExpired()) {
            return back()->withErrors(['poll' => 'This poll has expired.']);
        }

        $existingVote = PollVote::where('poll_id', $poll->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingVote) {
            $existingVote->update(['poll_option_id' => $request->option_id]);
        } else {
            PollVote::create([
                'poll_id' => $poll->id,
                'poll_option_id' => $request->option_id,
                'user_id' => $user->id,
            ]);
        }

        return back();
    }
}
