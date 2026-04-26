<?php

namespace App\Http\Requests;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['nullable','string', 'max:1000'],
            'parent_post_id' => ['nullable', 'exists:posts,id'],
            'quote_post_id' => ['nullable', 'exists:posts,id'],
            'is_private' => ['required', 'boolean'],
            'media' => ['nullable', 'array', 'max:4'],
            'media.*' => ['file', 'mimetypes:'.Media::ALLOWED_POST_MIMETYPES, 'max:51200'],
            'remove_media' => ['nullable', 'array'],
            'remove_media.*' => ['string'],
            'hashtags' => ['nullable','array'],
            'hashtags.*' => ['string','max:30'],
            'poll_options' => ['nullable', 'array', 'min:2', 'max:6'],
            'poll_options.*' => ['string', 'max:100'],
            'poll_expires_in' => ['nullable', 'integer', 'in:60,360,1440,4320,10080'],
        ];
    }

    public function messages(): array
    {
        return [
            'media.max' => 'You can attach up to 4 files per post.',
            'media.*.mimetypes' => 'Attachments must be a JPEG, PNG, GIF, WebP image or an MP4, MOV or WebM video.',
            'media.*.max' => 'Each attachment must be 50 MB or smaller.',
        ];
    }
}
