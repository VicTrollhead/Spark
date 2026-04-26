<?php

namespace App\Http\Requests;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('user'));
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'remove_profile_image' => filter_var($this->input('remove_profile_image'), FILTER_VALIDATE_BOOLEAN),
            'remove_cover_image' => filter_var($this->input('remove_cover_image'), FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:24'],
            'username' => ['required', 'string', 'max:20', Rule::unique('users')->ignore($this->route('user')->id)],
            'bio' => ['nullable', 'string', 'max:300'],
            'location' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'string', 'max:120'],
            'date_of_birth' => ['nullable', 'date'],
            'is_private' => ['required', 'boolean'],
            'status' => ['required', Rule::in(['active', 'suspended', 'deactivated'])],
            'profile_image' => [
                'nullable',
                'image',
                'mimetypes:'.Media::ALLOWED_IMAGE_MIMETYPES,
                'max:5120', // 5 MB
                'dimensions:min_width=64,min_height=64,max_width=4000,max_height=4000',
            ],
            'cover_image' => [
                'nullable',
                'image',
                'mimetypes:'.Media::ALLOWED_IMAGE_MIMETYPES,
                'max:10240', // 10 MB
                'dimensions:min_width=320,min_height=120,max_width=6000,max_height=4000',
            ],
            'remove_profile_image' => ['sometimes', 'boolean'],
            'remove_cover_image' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'profile_image.image' => 'Profile picture must be an image (JPEG, PNG, GIF or WebP).',
            'profile_image.mimetypes' => 'Profile picture must be a JPEG, PNG, GIF or WebP image — videos and other formats are not allowed.',
            'profile_image.max' => 'Profile picture must be 5 MB or smaller.',
            'profile_image.dimensions' => 'Profile picture must be between 64×64 and 4000×4000 pixels.',
            'cover_image.image' => 'Cover image must be an image (JPEG, PNG, GIF or WebP).',
            'cover_image.mimetypes' => 'Cover image must be a JPEG, PNG, GIF or WebP image — videos and other formats are not allowed.',
            'cover_image.max' => 'Cover image must be 10 MB or smaller.',
            'cover_image.dimensions' => 'Cover image must be between 320×120 and 6000×4000 pixels.',
        ];
    }
}
