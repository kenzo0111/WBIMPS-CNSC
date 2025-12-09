<?php

namespace App\Http\Controllers;

use App\Models\SupportAttachment;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupportController extends Controller
{
    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:191',
            'email' => 'required|email|max:191',
            'submission_type' => 'nullable|string|in:inquiry,signed_form',
            'attachments.*' => 'file|max:10240|mimes:jpg,jpeg,png,pdf',
        ];

        if ($request->input('submission_type') === 'signed_form') {
            $rules['message'] = 'nullable|string';
            $rules['attachments'] = 'required|array|min:1';
        } else {
            $rules['message'] = 'required|string';
            $rules['attachments'] = 'nullable|array';
        }

        $data = $request->validate($rules);

        $message = $data['message'] ?? '';
        if ($request->input('submission_type') === 'signed_form') {
            $message = trim("[Signed Form Submission]\n" . $message);
        }

        $ticket = SupportTicket::create([
            'ticket_id' => 'T' . time() . Str::upper(Str::random(4)),
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $message,
            'status' => 'Open',
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                if (!$file->isValid()) {
                    continue;
                }
                $path = $file->store('support_attachments');
                $ticket->attachments()->create([
                    'filename' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]);
            }
        }

        // Return back with success message. For AJAX clients, return json.
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'ticket' => $ticket], 201);
        }

        return redirect()->back()->with('support_success', 'Ticket submitted successfully.');
    }

    // Serve attachment file for preview/download
    public function attachment($id)
    {
        $att = SupportAttachment::find($id);
        if (!$att) {
            abort(404);
        }
        $diskPath = $att->filename;
        if (!\Illuminate\Support\Facades\Storage::exists($diskPath)) {
            abort(404);
        }
        $stream = \Illuminate\Support\Facades\Storage::download($diskPath, $att->original_name);

        return $stream;
    }
}
