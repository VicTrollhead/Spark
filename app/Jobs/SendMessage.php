<?php

namespace App\Jobs;

use App\Events\GotMessage;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public Message $message)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->message->load('user.profileImage');
        $user = $this->message->user;

        GotMessage::dispatch([
            'id' => $this->message->id,
            'text' => $this->message->text,
            'time' => $this->message->time,
            'media' => [],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'is_verified' => $user->is_verified,
                'profile_image' => $user->profileImage ? [
                    'file_path' => $user->profileImage->file_path,
                    'disk' => $user->profileImage->disk,
                    'url' => $user->profileImage->url,
                ] : null,
            ],
        ]);
    }
}
