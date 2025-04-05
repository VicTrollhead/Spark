<?php

namespace App\Http\Requests;

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
            'content' => ['required', 'string', 'max:5000'],
            'parent_post_id' => ['nullable', 'exists:posts,id'],
            'media_url' => ['nullable', 'string', 'max:255'],
            'is_private' => ['required', 'boolean'],
            'hashtags' => ['nullable','array'],
            'hashtags.*' => ['string','max:255'],
        ];
    }
}
