<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\SupportTicket;
use App\Models\SupportAttachment;

class SupportController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'required|email|max:191',
            'message' => 'required|string',
            'attachments.*' => 'file|max:10240|mimes:jpg,jpeg,png,pdf',
        ]);

        $ticket = SupportTicket::create([
            'ticket_id' => 'T'.time().Str::upper(Str::random(4)),
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
            'status' => 'Open',
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                if (!$file->isValid()) continue;
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
        if (!$att) abort(404);
        $diskPath = $att->filename;
        if (!\Illuminate\Support\Facades\Storage::exists($diskPath)) abort(404);
        $stream = \Illuminate\Support\Facades\Storage::download($diskPath, $att->original_name);
        return $stream;
    }
}
