<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SupportTicket;
use App\Models\SupportAttachment;
use Illuminate\Support\Facades\Storage;

class SupportController extends Controller
{
    // GET /api/support-tickets
    public function index(Request $request)
    {
        $tickets = SupportTicket::with('attachments')->orderBy('id', 'desc')->get();
        return response()->json($tickets);
    }

    // GET /api/support-tickets/{id}
    public function show($id)
    {
        $ticket = SupportTicket::with('attachments')->find($id);
        if (!$ticket) return response()->json(['message' => 'Not found'], 404);
        return response()->json($ticket);
    }

    // POST /api/support-tickets/{id}/status
    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|string']);
        $ticket = SupportTicket::find($id);
        if (!$ticket) return response()->json(['message' => 'Not found'], 404);
        $ticket->status = $request->input('status');
        $ticket->save();
        return response()->json($ticket);
    }

    // GET /support/attachment/{id} - handled by web route for file download/preview
}
