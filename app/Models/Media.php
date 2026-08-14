<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use HasFactory;

    public const ALLOWED_IMAGE_MIMETYPES = 'image/jpeg,image/png,image/gif,image/webp';

    public const ALLOWED_VIDEO_MIMETYPES = 'video/mp4,video/quicktime,video/webm';

    public const ALLOWED_POST_MIMETYPES = self::ALLOWED_IMAGE_MIMETYPES.','.self::ALLOWED_VIDEO_MIMETYPES;

    protected $fillable = [
        'file_path',
        'file_type',
        'disk',
        'mediable_id',
        'mediable_type',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Media $media) {
            $disk = $media->disk ?? config('filesystems.default');
            try {
                Storage::disk($disk)->delete($media->file_path);
            } catch (\Throwable $e) {
                Log::warning('Failed to delete media file from storage', [
                    'media_id' => $media->id,
                    'disk' => $disk,
                    'file_path' => $media->file_path,
                    'error' => $e->getMessage(),
                ]);
            }
        });
    }

    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    protected $appends = ['url'];

    public function getUrlAttribute(): string
    {
        $disk = $this->disk ?? config('filesystems.default');

        return Storage::disk($disk)->url($this->file_path);
    }
}
