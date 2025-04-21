<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = ['user1_id', 'user2_id'];

    public static function getChat($userId1, $userId2)
    {
        return self::where(function ($query) use ($userId1, $userId2) {
            $query->where('user1_id', $userId1)->where('user2_id', $userId2);
        })->orWhere(function ($query) use ($userId1, $userId2) {
            $query->where('user1_id', $userId2)->where('user2_id', $userId1);
        })->first();
    }

    public static function firstOrCreateChat($userId1, $userId2)
    {
        return self::firstOrCreate(
            [
                'user1_id' => min($userId1, $userId2),
                'user2_id' => max($userId1, $userId2),
            ]
        );
    }

}

