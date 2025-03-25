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
            'content_' => ['required', 'string', 'max:5000'],
            'parent_post_id' => ['nullable', 'exists:posts,id'],
//            'post_type' => ['required', 'string'],
            'is_public' => ['required', 'boolean'],
        ];
    }
}
