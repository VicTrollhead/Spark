<?php

namespace Database\Factories;

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Like>
 */
class LikeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = Like::class;

    public function definition(): array
    {
        return [
            'user_id' => null,
            'likeable_id' => null,
            'likeable_type' => null,
            'is_deleted' => false,
        ];
    }
}
