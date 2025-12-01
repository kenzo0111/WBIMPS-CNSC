<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'tin' => [
                'nullable',
                'string',
                'max:64',
                'regex:/^(\d{3}-\d{3}-\d{3}-\d{3}|\d{3}-\d{3}-\d{3}|\d{9}|\d{12})$/',
            ],
            'contact' => [
                'nullable',
                'string',
                'max:128',
                'regex:/^[0-9+\s\-()]{7,30}$/',
            ],
            'email' => 'nullable|email|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $contact = $this->input('contact');
            if (!empty($contact)) {
                $normalized = preg_replace('/\D/', '', $contact);
                if (strlen($normalized) < 7 || strlen($normalized) > 15) {
                    $validator->errors()->add('contact', 'Contact must be 7 to 15 digits after normalization.');
                }
            }
        });
    }
}
